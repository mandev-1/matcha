package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"strings"

	"matcha/internal/database"
	"matcha/internal/services"
)

// ChatListAPI handles GET /api/chat
func ChatListAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Get all connected users with their last message
	rows, err := database.DB.Query(`
		SELECT DISTINCT
			u.id, u.username, u.first_name, u.last_name,
			(SELECT file_path FROM user_pictures WHERE user_id = u.id AND is_profile = 1 AND order_index = 0 LIMIT 1) as profile_picture,
			(SELECT content FROM messages 
			 WHERE (from_user_id = ? AND to_user_id = u.id) OR (from_user_id = u.id AND to_user_id = ?)
			 ORDER BY created_at DESC LIMIT 1) as last_message,
			(SELECT created_at FROM messages 
			 WHERE (from_user_id = ? AND to_user_id = u.id) OR (from_user_id = u.id AND to_user_id = ?)
			 ORDER BY created_at DESC LIMIT 1) as last_message_time,
			(SELECT COUNT(*) FROM messages 
			 WHERE from_user_id = u.id AND to_user_id = ? AND is_read = 0) as unread_count
		FROM users u
		INNER JOIN likes l1 ON l1.from_user_id = ? AND l1.to_user_id = u.id
		INNER JOIN likes l2 ON l2.from_user_id = u.id AND l2.to_user_id = ?
		WHERE u.is_setup = 1 AND u.is_email_verified = 1
		ORDER BY CASE WHEN last_message_time IS NULL THEN 1 ELSE 0 END, last_message_time DESC
	`, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID)
	if err != nil {
		log.Printf("Error querying chat list: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load chat list")
		return
	}
	defer rows.Close()

	conversations := []map[string]interface{}{}
	for rows.Next() {
		var conv struct {
			ID            int64
			Username      string
			FirstName     string
			LastName      string
			ProfilePicture sql.NullString
			LastMessage   sql.NullString
			LastMessageTime sql.NullString
			UnreadCount   int64
		}

		err := rows.Scan(
			&conv.ID, &conv.Username, &conv.FirstName, &conv.LastName,
			&conv.ProfilePicture, &conv.LastMessage, &conv.LastMessageTime, &conv.UnreadCount,
		)
		if err != nil {
			log.Printf("Error scanning conversation: %v", err)
			continue
		}

		// Normalize empty strings
		firstName := normalizeEmptyString(conv.FirstName)
		lastName := normalizeEmptyString(conv.LastName)
		
		conversationData := map[string]interface{}{
			"id":            conv.ID,
			"name":          firstName + " " + lastName,
			"unread_count": conv.UnreadCount,
		}

		if conv.ProfilePicture.Valid && conv.ProfilePicture.String != "" {
			conversationData["avatar"] = normalizeEmptyString(conv.ProfilePicture.String)
		} else {
			conversationData["avatar"] = ""
		}

		if conv.LastMessage.Valid && conv.LastMessage.String != "" {
			conversationData["last_message"] = normalizeEmptyString(conv.LastMessage.String)
		} else {
			conversationData["last_message"] = ""
		}

		conversations = append(conversations, conversationData)
	}

	SendSuccess(w, map[string]interface{}{
		"conversations": conversations,
	})
}

// MessagesAPI handles GET /api/messages/:id
func MessagesAPI(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in MessagesAPI: %v", r)
			SendError(w, http.StatusInternalServerError, "Internal Server Error")
		}
	}()

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
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "messages" {
		userIDStr = parts[2]
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("MessagesAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	otherUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || otherUserID <= 0 {
		log.Printf("MessagesAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Verify they are connected (mutual likes)
	var likeID1, likeID2 int64
	err1 := database.DB.QueryRow(`
		SELECT id FROM likes WHERE from_user_id = ? AND to_user_id = ?
	`, currentUserID, otherUserID).Scan(&likeID1)
	err2 := database.DB.QueryRow(`
		SELECT id FROM likes WHERE from_user_id = ? AND to_user_id = ?
	`, otherUserID, currentUserID).Scan(&likeID2)

	if err1 != nil || err2 != nil {
		SendError(w, http.StatusForbidden, "You are not connected with this user")
		return
	}

	// Load message history
	rows, err := database.DB.Query(`
		SELECT id, from_user_id, to_user_id, content, is_read, created_at
		FROM messages
		WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
		ORDER BY created_at ASC
	`, currentUserID, otherUserID, otherUserID, currentUserID)
	if err != nil {
		log.Printf("Error querying messages: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load messages")
		return
	}
	defer rows.Close()

	messages := []map[string]interface{}{}
	for rows.Next() {
		var msg struct {
			ID        int64
			FromUserID int64
			ToUserID  int64
			Content   string
			IsRead    bool
			CreatedAt string
		}

		err := rows.Scan(&msg.ID, &msg.FromUserID, &msg.ToUserID, &msg.Content, &msg.IsRead, &msg.CreatedAt)
		if err != nil {
			log.Printf("Error scanning message: %v", err)
			continue
		}

		// Normalize empty strings
		content := normalizeEmptyString(msg.Content)
		if content == "" {
			content = "-" // Default for empty content
		}

		createdAt := normalizeEmptyString(msg.CreatedAt)
		if createdAt == "" {
			createdAt = "-"
		}

		messages = append(messages, map[string]interface{}{
			"id":                   msg.ID,
			"content":              content,
			"is_from_current_user": msg.FromUserID == currentUserID,
			"created_at":           createdAt,
			"is_read":              msg.IsRead,
		})
	}

	// Mark messages as read
	_, _ = database.DB.Exec(`
		UPDATE messages 
		SET is_read = 1 
		WHERE from_user_id = ? AND to_user_id = ? AND is_read = 0
	`, otherUserID, currentUserID)

	SendSuccess(w, map[string]interface{}{
		"messages": messages,
		"chat_id":  otherUserID,
	})
}

// SendMessageAPI handles POST /api/messages/:id
func SendMessageAPI(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in SendMessageAPI: %v", r)
			SendError(w, http.StatusInternalServerError, "Internal Server Error")
		}
	}()

	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Update online status and last_seen sporadically
	ensureUserIsOnline(currentUserID)
	updateLastSeenSporadically(currentUserID)

	// Extract user ID from URL path
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "messages" {
		userIDStr = parts[2]
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}
	
	if userIDStr == "" {
		log.Printf("SendMessageAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}
	
	targetUserID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || targetUserID <= 0 {
		log.Printf("SendMessageAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Verify they are connected
	var likeID1, likeID2 int64
	err1 := database.DB.QueryRow(`
		SELECT id FROM likes WHERE from_user_id = ? AND to_user_id = ?
	`, currentUserID, targetUserID).Scan(&likeID1)
	err2 := database.DB.QueryRow(`
		SELECT id FROM likes WHERE from_user_id = ? AND to_user_id = ?
	`, targetUserID, currentUserID).Scan(&likeID2)

	if err1 != nil || err2 != nil {
		SendError(w, http.StatusForbidden, "You are not connected with this user")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := ParseJSONBody(r, &req); err != nil {
		log.Printf("Error parsing request body: %v", err)
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Trim and validate content
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		SendError(w, http.StatusBadRequest, "Message content cannot be empty")
		return
	}

	// Insert message using write queue for concurrent safety
	writeResult := database.GetWriteQueue().Enqueue(`
		INSERT INTO messages (from_user_id, to_user_id, content, is_read, created_at)
		VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
	`, currentUserID, targetUserID, req.Content)
	if writeResult.Error != nil {
		log.Printf("Error inserting message: %v", writeResult.Error)
		SendError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	messageID := writeResult.LastInsertID

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
				VALUES (?, ?, 'send_message', ?, ?, ?)
			`, currentUserID, botUsername, targetUserID, targetUsername, req.Content)
		}()
	}

	// Notify the recipient (sync so notification exists before response)
	insertNotificationSync(targetUserID, "message", getDisplayName(currentUserID)+" sent you a message", currentUserID)

	// Update fame rating for message sender (async)
	go func() {
		if err := services.UpdateFameRating(currentUserID); err != nil {
			log.Printf("Error updating fame rating for user %d: %v", currentUserID, err)
		}
	}()

	SendSuccess(w, map[string]interface{}{
		"message": "Message sent successfully",
		"chat_id": targetUserID,
		"message_id": messageID,
	})
}
