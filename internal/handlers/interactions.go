package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"matcha/internal/database"
	"matcha/internal/services"
)

// LikeAPI handles POST /api/like/:id
func LikeAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Update online status and last_seen sporadically
	ensureUserIsOnline(currentUserID)
	updateLastSeenSporadically(currentUserID)

	// Extract user ID from URL path directly (more reliable than pat.Param)
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	// Expected format: api/like/123
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "like" {
		userIDStr = parts[2]
		// Remove query parameters if any
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("LikeAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("LikeAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Prevent users from liking themselves
	if currentUserID == targetUserID {
		SendError(w, http.StatusBadRequest, "Cannot like yourself")
		return
	}

	// Check if like already exists
	var existingLikeID int64
	err = database.DB.QueryRow(`
		SELECT id FROM likes 
		WHERE from_user_id = ? AND to_user_id = ?
	`, currentUserID, targetUserID).Scan(&existingLikeID)

	if err == nil {
		// Like already exists
		SendSuccess(w, map[string]interface{}{
			"message":      "User already liked",
			"user_id":      targetUserID,
			"is_connected": false,
		})
		return
	} else if err != sql.ErrNoRows {
		log.Printf("Error checking existing like: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to process like")
		return
	}

	// Insert new like using write queue for concurrent safety
	result := database.GetWriteQueue().Enqueue(`
		INSERT INTO likes (from_user_id, to_user_id, created_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
	`, currentUserID, targetUserID)
	if result.Error != nil {
		log.Printf("Error inserting like: %v", result.Error)
		SendError(w, http.StatusInternalServerError, "Failed to process like")
		return
	}

	// Check if current user is a bot and log activity
	var isBot int
	var botUsername string
	err = database.DB.QueryRow("SELECT is_bot, username FROM users WHERE id = ?", currentUserID).Scan(&isBot, &botUsername)
	if err == nil && isBot == 1 {
		var targetUsername string
		database.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetUserID).Scan(&targetUsername)
		// Log bot activity asynchronously
		go func() {
			database.GetWriteQueue().EnqueueAsync(`
				INSERT INTO bot_activity_log (bot_id, bot_username, action_type, target_user_id, target_username, details)
				VALUES (?, ?, 'like_profile', ?, ?, '')
			`, currentUserID, botUsername, targetUserID, targetUsername)
		}()
	}

	// Update fame rating for both users (liking gives points, receiving like gives points)
	go func() {
		if err := services.UpdateFameRating(currentUserID); err != nil {
			log.Printf("Error updating fame rating for user %d: %v", currentUserID, err)
		}
		if err := services.UpdateFameRating(targetUserID); err != nil {
			log.Printf("Error updating fame rating for user %d: %v", targetUserID, err)
		}
	}()

	// Notify the user who was liked (sync so notification exists before response)
	insertNotificationSync(targetUserID, "like", getDisplayName(currentUserID)+" liked you", currentUserID)

	// Check if it's a mutual like (connection)
	var mutualLikeID int64
	err = database.DB.QueryRow(`
		SELECT id FROM likes 
		WHERE from_user_id = ? AND to_user_id = ?
	`, targetUserID, currentUserID).Scan(&mutualLikeID)

	isConnected := (err == nil)
	if isConnected {
		insertNotificationSync(targetUserID, "match", "You're connected with "+getDisplayName(currentUserID)+"!", currentUserID)
	}

	SendSuccess(w, map[string]interface{}{
		"message":      "User liked successfully",
		"user_id":      targetUserID,
		"is_connected": isConnected,
	})
}

// UnlikeAPI handles POST /api/unlike/:id
func UnlikeAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Extract user ID from URL path directly (more reliable than pat.Param)
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	// Expected format: api/unlike/123
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "unlike" {
		userIDStr = parts[2]
		// Remove query parameters if any
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("UnlikeAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("UnlikeAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Delete the like
	result, err := database.DB.Exec(`
		DELETE FROM likes 
		WHERE from_user_id = ? AND to_user_id = ?
	`, currentUserID, targetUserID)
	if err != nil {
		log.Printf("Error deleting like: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to process unlike")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
	}

	if rowsAffected == 0 {
		// Like didn't exist
		SendSuccess(w, map[string]interface{}{
			"message": "User was not liked",
			"user_id": targetUserID,
		})
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "User unliked successfully",
		"user_id": targetUserID,
	})
}

// ConnectionsAPI handles GET /api/connections
func ConnectionsAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Get all mutual likes (connections)
	// A connection exists when both users have liked each other
	rows, err := database.DB.Query(`
		SELECT DISTINCT
			u.id, u.username, u.first_name, u.last_name, u.gender, u.biography,
			u.birth_date, u.location, u.fame_rating, u.is_online, u.last_seen,
			u.latitude, u.longitude,
			(SELECT file_path FROM user_pictures WHERE user_id = u.id AND is_profile = 1 AND order_index = 0 LIMIT 1) as profile_picture,
			(SELECT MAX(l.created_at) FROM likes l WHERE (l.from_user_id = ? AND l.to_user_id = u.id) OR (l.from_user_id = u.id AND l.to_user_id = ?)) as connected_at
		FROM users u
		INNER JOIN likes l1 ON l1.from_user_id = ? AND l1.to_user_id = u.id
		INNER JOIN likes l2 ON l2.from_user_id = u.id AND l2.to_user_id = ?
		WHERE u.is_setup = 1 AND u.is_email_verified = 1
		ORDER BY connected_at DESC
	`, currentUserID, currentUserID, currentUserID, currentUserID)
	if err != nil {
		log.Printf("Error querying connections: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load connections")
		return
	}
	defer rows.Close()

	connections := []map[string]interface{}{}
	for rows.Next() {
		var user struct {
			ID            int64
			Username      string
			FirstName     string
			LastName      string
			Gender        sql.NullString
			Biography     sql.NullString
			BirthDate     sql.NullString
			Location      sql.NullString
			FameRating    float64
			IsOnline      bool
			LastSeen      sql.NullString
			Latitude      sql.NullFloat64
			Longitude     sql.NullFloat64
			ProfilePicture sql.NullString
			ConnectedAt   sql.NullString
		}

		err := rows.Scan(
			&user.ID, &user.Username, &user.FirstName, &user.LastName, &user.Gender,
			&user.Biography, &user.BirthDate, &user.Location, &user.FameRating,
			&user.IsOnline, &user.LastSeen, &user.Latitude, &user.Longitude,
			&user.ProfilePicture, &user.ConnectedAt,
		)
		if err != nil {
			log.Printf("Error scanning connection: %v", err)
			continue
		}

		// Calculate age
		age := 0
		if user.BirthDate.Valid {
			if birthDate, err := time.Parse("2006-01-02", user.BirthDate.String); err == nil {
				age = time.Now().Year() - birthDate.Year()
				if time.Now().Before(time.Date(time.Now().Year(), birthDate.Month(), birthDate.Day(), 0, 0, 0, 0, time.UTC)) {
					age--
				}
			}
		}

		// Get tags
		tags := []string{}
		tagRows, err := database.DB.Query("SELECT tag FROM user_tags WHERE user_id = ?", user.ID)
		if err == nil {
			defer tagRows.Close()
			for tagRows.Next() {
				var tag string
				if err := tagRows.Scan(&tag); err == nil {
					tags = append(tags, tag)
				}
			}
		}

		connectionData := map[string]interface{}{
			"id":              user.ID,
			"username":        normalizeEmptyString(user.Username),
			"first_name":      normalizeEmptyString(user.FirstName),
			"last_name":       normalizeEmptyString(user.LastName),
			"age":             age,
			"fame_rating":     user.FameRating,
			"is_online":       user.IsOnline,
			"images":          []string{},
			"tags":            tags,
		}

		if user.Location.Valid {
			connectionData["location"] = normalizeEmptyString(user.Location.String)
		} else {
			connectionData["location"] = "-"
		}

		if user.Biography.Valid {
			connectionData["biography"] = normalizeEmptyString(user.Biography.String)
		} else {
			connectionData["biography"] = "-"
		}

		if user.LastSeen.Valid {
			connectionData["last_seen"] = normalizeEmptyString(user.LastSeen.String)
		} else {
			connectionData["last_seen"] = "-"
		}

		if user.ProfilePicture.Valid {
			connectionData["profile_picture"] = normalizeEmptyString(user.ProfilePicture.String)
		} else {
			connectionData["profile_picture"] = "-"
		}

		if user.Gender.Valid {
			connectionData["gender"] = normalizeEmptyString(user.Gender.String)
		}

		if user.ConnectedAt.Valid {
			connectionData["connected_at"] = user.ConnectedAt.String
		}

		connections = append(connections, connectionData)
	}

	SendSuccess(w, map[string]interface{}{
		"connections": connections,
	})
}

// BlockUserAPI handles POST /api/block/:id
func BlockUserAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Extract user ID from URL path
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "block" {
		userIDStr = parts[2]
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("BlockUserAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("BlockUserAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Prevent users from blocking themselves
	if currentUserID == targetUserID {
		SendError(w, http.StatusBadRequest, "Cannot block yourself")
		return
	}

	// Check if already blocked
	var existingBlockID int64
	err = database.DB.QueryRow(`
		SELECT id FROM blocks 
		WHERE blocker_id = ? AND blocked_id = ?
	`, currentUserID, targetUserID).Scan(&existingBlockID)

	if err == nil {
		// Already blocked
		SendSuccess(w, map[string]interface{}{
			"message": "User already blocked",
			"user_id": targetUserID,
		})
		return
	} else if err != sql.ErrNoRows {
		log.Printf("Error checking existing block: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to process block")
		return
	}

	// Insert block
	_, err = database.DB.Exec(`
		INSERT INTO blocks (blocker_id, blocked_id, created_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
	`, currentUserID, targetUserID)
	if err != nil {
		log.Printf("Error inserting block: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to block user")
		return
	}

	// Delete any existing likes between the users
	_, _ = database.DB.Exec(`
		DELETE FROM likes 
		WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
	`, currentUserID, targetUserID, targetUserID, currentUserID)

	SendSuccess(w, map[string]interface{}{
		"message": "User blocked successfully",
		"user_id": targetUserID,
	})
}

// ReportUserAPI handles POST /api/report/:id
func ReportUserAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Extract user ID from URL path
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "report" {
		userIDStr = parts[2]
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("ReportUserAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("ReportUserAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Prevent users from reporting themselves
	if currentUserID == targetUserID {
		SendError(w, http.StatusBadRequest, "Cannot report yourself")
		return
	}

	// Parse request body for reason
	var req struct {
		Reason string `json:"reason"`
	}
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Reason == "" {
		req.Reason = "This is not a human"
	}

	// Insert report
	_, err = database.DB.Exec(`
		INSERT INTO reports (reporter_id, reported_id, reason, created_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
	`, currentUserID, targetUserID, req.Reason)
	if err != nil {
		log.Printf("Error inserting report: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to report user")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "User reported successfully",
		"user_id": targetUserID,
	})
}

// SimulateConnectionAPI handles POST /api/simulate-connection/:id (Dev Only)
func SimulateConnectionAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Extract user ID from URL path
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "simulate-connection" {
		userIDStr = parts[2]
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("SimulateConnectionAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("SimulateConnectionAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Prevent users from connecting with themselves
	if currentUserID == targetUserID {
		SendError(w, http.StatusBadRequest, "Cannot connect with yourself")
		return
	}

	// Create like from current user to target user (if not exists)
	var existingLikeID1 int64
	err = database.DB.QueryRow(`
		SELECT id FROM likes 
		WHERE from_user_id = ? AND to_user_id = ?
	`, currentUserID, targetUserID).Scan(&existingLikeID1)
	
	if err == sql.ErrNoRows {
		// Create like from current user to target
		_, err = database.DB.Exec(`
			INSERT INTO likes (from_user_id, to_user_id, created_at)
			VALUES (?, ?, CURRENT_TIMESTAMP)
		`, currentUserID, targetUserID)
		if err != nil {
			log.Printf("Error creating like 1: %v", err)
			SendError(w, http.StatusInternalServerError, "Failed to simulate connection")
			return
		}
	} else if err != nil {
		log.Printf("Error checking like 1: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to simulate connection")
		return
	}

	// Create like from target user to current user (if not exists)
	var existingLikeID2 int64
	err = database.DB.QueryRow(`
		SELECT id FROM likes 
		WHERE from_user_id = ? AND to_user_id = ?
	`, targetUserID, currentUserID).Scan(&existingLikeID2)
	
	if err == sql.ErrNoRows {
		// Create like from target to current user
		_, err = database.DB.Exec(`
			INSERT INTO likes (from_user_id, to_user_id, created_at)
			VALUES (?, ?, CURRENT_TIMESTAMP)
		`, targetUserID, currentUserID)
		if err != nil {
			log.Printf("Error creating like 2: %v", err)
			SendError(w, http.StatusInternalServerError, "Failed to simulate connection")
			return
		}
	} else if err != nil {
		log.Printf("Error checking like 2: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to simulate connection")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message":      "Connection simulated successfully (Dev Only)",
		"user_id":      targetUserID,
		"is_connected": true,
	})
}

// UnblockUserAPI handles POST /api/unblock/:id
func UnblockUserAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Extract user ID from URL path
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "unblock" {
		userIDStr = parts[2]
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("UnblockUserAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("UnblockUserAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Delete the block
	result, err := database.DB.Exec(`
		DELETE FROM blocks 
		WHERE blocker_id = ? AND blocked_id = ?
	`, currentUserID, targetUserID)
	if err != nil {
		log.Printf("Error deleting block: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to unblock user")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
	}

	if rowsAffected == 0 {
		// Block didn't exist
		SendSuccess(w, map[string]interface{}{
			"message": "User was not blocked",
			"user_id": targetUserID,
		})
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "User unblocked successfully",
		"user_id": targetUserID,
	})
}


