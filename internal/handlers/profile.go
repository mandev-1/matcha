package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"matcha/internal/database"
	"matcha/internal/services"
)

// ProfileAPI handles GET /api/profile
func ProfileAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Ensure user is online and update last_seen sporadically
	ensureUserIsOnline(userID)
	updateLastSeenSporadically(userID)

	// Load user profile from database
	var user struct {
		ID                int64
		Username          string
		Email             string
		FirstName         string
		LastName          string
		Gender            *string
		SexualPreference  *string
		Biography         *string
		BirthDate         *string
		Location          *string
		Latitude          *float64
		Longitude         *float64
		LocationUpdatedAt *string
		FameRating        float64
		IsSetup           bool
		Openness          *string
		Conscientiousness *string
		Extraversion      *string
		Agreeableness     *string
		Neuroticism       *string
		Siblings          *string
		MBTI              *string
		CaliperProfile    *string
		LastSeen          *string
		CreatedAt         *string
	}

	err = database.DB.QueryRow(`
		SELECT 
			id, username, email, first_name, last_name,
			gender, sexual_preference, biography, birth_date,
			location, latitude, longitude, location_updated_at, fame_rating, is_setup,
			openness, conscientiousness, extraversion, agreeableness, neuroticism,
			siblings, mbti, caliper_profile, last_seen, created_at
		FROM users 
		WHERE id = ?
	`, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName,
		&user.Gender, &user.SexualPreference, &user.Biography, &user.BirthDate,
		&user.Location, &user.Latitude, &user.Longitude, &user.LocationUpdatedAt, &user.FameRating, &user.IsSetup,
		&user.Openness, &user.Conscientiousness, &user.Extraversion, &user.Agreeableness, &user.Neuroticism,
		&user.Siblings, &user.MBTI, &user.CaliperProfile, &user.LastSeen, &user.CreatedAt,
	)

	if err != nil {
		log.Printf("Error loading profile: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load profile")
		return
	}

	// Build response
	response := map[string]interface{}{
		"id":          user.ID,
		"username":    user.Username,
		"email":       user.Email,
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
		"fame_rating": user.FameRating,
		"is_setup":    user.IsSetup,
	}

	// Add nullable fields if they exist
	if user.Gender != nil {
		response["gender"] = *user.Gender
	}
	if user.SexualPreference != nil {
		response["sexual_preference"] = *user.SexualPreference
	}
	if user.Biography != nil {
		response["biography"] = *user.Biography
	}
	if user.BirthDate != nil {
		response["birth_date"] = *user.BirthDate
	}
	if user.Location != nil {
		response["location"] = *user.Location
	}
	if user.Latitude != nil {
		response["latitude"] = *user.Latitude
	}
	if user.Longitude != nil {
		response["longitude"] = *user.Longitude
	}
	if user.LocationUpdatedAt != nil {
		response["location_updated_at"] = *user.LocationUpdatedAt
	}
	if user.LastSeen != nil {
		response["last_seen"] = *user.LastSeen
	}
	if user.CreatedAt != nil {
		response["created_at"] = *user.CreatedAt
	}

	// Add Big Five personality traits
	bigFive := map[string]string{}
	if user.Openness != nil {
		bigFive["openness"] = *user.Openness
	}
	if user.Conscientiousness != nil {
		bigFive["conscientiousness"] = *user.Conscientiousness
	}
	if user.Extraversion != nil {
		bigFive["extraversion"] = *user.Extraversion
	}
	if user.Agreeableness != nil {
		bigFive["agreeableness"] = *user.Agreeableness
	}
	if user.Neuroticism != nil {
		bigFive["neuroticism"] = *user.Neuroticism
	}
	response["big_five"] = bigFive

	// Add other personality fields
	if user.Siblings != nil {
		response["siblings"] = *user.Siblings
	}
	if user.MBTI != nil {
		response["mbti"] = *user.MBTI
	}
	if user.CaliperProfile != nil {
		response["caliper_profile"] = *user.CaliperProfile
	}

	// Load tags from user_tags table
	rows, err := database.DB.Query("SELECT tag FROM user_tags WHERE user_id = ?", userID)
	if err == nil {
		defer rows.Close()
		tags := []string{}
		for rows.Next() {
			var tag string
			if err := rows.Scan(&tag); err == nil {
				tags = append(tags, tag)
			}
		}
		response["tags"] = tags
	} else {
		response["tags"] = []string{}
	}

	// Load images from user_pictures table
	imageRows, err := database.DB.Query(`
		SELECT id, file_path, is_profile, order_index 
		FROM user_pictures 
		WHERE user_id = ? 
		ORDER BY order_index ASC
	`, userID)
	if err == nil {
		defer imageRows.Close()
		images := []map[string]interface{}{}
		for imageRows.Next() {
			var id int64
			var filePath string
			var isProfile int
			var orderIndex int
			if err := imageRows.Scan(&id, &filePath, &isProfile, &orderIndex); err == nil {
				images = append(images, map[string]interface{}{
					"id":          id,
					"file_path":   filePath,
					"is_profile":  isProfile == 1,
					"order_index": orderIndex,
				})
			}
		}
		response["images"] = images
	} else {
		response["images"] = []map[string]interface{}{}
	}

	// Likes received (for profile display)
	var likesReceived int64
	if err := database.DB.QueryRow("SELECT COUNT(*) FROM likes WHERE to_user_id = ?", userID).Scan(&likesReceived); err == nil {
		response["likes_received_count"] = likesReceived
	} else {
		response["likes_received_count"] = int64(0)
	}

	SendSuccess(w, response)
}

// ProfileUpdateRequest represents profile update request
type ProfileUpdateRequest struct {
	FirstName        string            `json:"first_name"`
	LastName         string            `json:"last_name"`
	Email            string            `json:"email"`
	Gender           string            `json:"gender"`
	SexualPreference string            `json:"sexual_preference"`
	Biography        string            `json:"biography"`
	BigFive          map[string]string `json:"big_five"`
	Siblings         string            `json:"siblings"`
	MBTI             string            `json:"mbti"`
	CaliperProfile   string            `json:"caliper_profile"`
	Tags             []string          `json:"tags"`
	Latitude         *float64          `json:"latitude"`
	Longitude        *float64          `json:"longitude"`
	Location         string            `json:"location"`
}

// ProfileUpdateAPI handles POST /api/profile
func ProfileUpdateAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Parse request body
	var req ProfileUpdateRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Build update query dynamically based on provided fields
	updates := []string{}
	args := []interface{}{}

	if req.FirstName != "" {
		updates = append(updates, "first_name = ?")
		args = append(args, req.FirstName)
	}

	if req.LastName != "" {
		updates = append(updates, "last_name = ?")
		args = append(args, req.LastName)
	}

	if req.Email != "" {
		// Check if email is already taken by another user
		var existingUserID int64
		err := database.DB.QueryRow("SELECT id FROM users WHERE email = ? AND id != ?", req.Email, userID).Scan(&existingUserID)
		if err == nil {
			SendError(w, http.StatusBadRequest, "Email is already taken")
			return
		}
		updates = append(updates, "email = ?")
		args = append(args, req.Email)
	}

	if req.Gender != "" {
		updates = append(updates, "gender = ?")
		args = append(args, req.Gender)
	}

	if req.SexualPreference != "" {
		updates = append(updates, "sexual_preference = ?")
		args = append(args, req.SexualPreference)
	}

	if req.Biography != "" {
		if len(req.Biography) > MaxBiographyLength {
			SendError(w, http.StatusBadRequest, "Biography too long")
			return
		}
		updates = append(updates, "biography = ?")
		args = append(args, req.Biography)
	}

	// Big Five personality traits
	if req.BigFive != nil {
		if openness, ok := req.BigFive["openness"]; ok && openness != "" {
			updates = append(updates, "openness = ?")
			args = append(args, openness)
		}
		if conscientiousness, ok := req.BigFive["conscientiousness"]; ok && conscientiousness != "" {
			updates = append(updates, "conscientiousness = ?")
			args = append(args, conscientiousness)
		}
		if extraversion, ok := req.BigFive["extraversion"]; ok && extraversion != "" {
			updates = append(updates, "extraversion = ?")
			args = append(args, extraversion)
		}
		if agreeableness, ok := req.BigFive["agreeableness"]; ok && agreeableness != "" {
			updates = append(updates, "agreeableness = ?")
			args = append(args, agreeableness)
		}
		if neuroticism, ok := req.BigFive["neuroticism"]; ok && neuroticism != "" {
			updates = append(updates, "neuroticism = ?")
			args = append(args, neuroticism)
		}
	}

	// Other personality fields
	if req.Siblings != "" {
		updates = append(updates, "siblings = ?")
		args = append(args, req.Siblings)
	}
	if req.MBTI != "" {
		updates = append(updates, "mbti = ?")
		args = append(args, req.MBTI)
	}
	if req.CaliperProfile != "" {
		updates = append(updates, "caliper_profile = ?")
		args = append(args, req.CaliperProfile)
	}

	// Location fields
	locationUpdated := false
	if req.Latitude != nil {
		updates = append(updates, "latitude = ?")
		args = append(args, *req.Latitude)
		locationUpdated = true
	}
	if req.Longitude != nil {
		updates = append(updates, "longitude = ?")
		args = append(args, *req.Longitude)
		locationUpdated = true
	}
	if req.Location != "" {
		updates = append(updates, "location = ?")
		args = append(args, req.Location)
	}
	// Update location_updated_at when location coordinates are updated
	if locationUpdated {
		updates = append(updates, "location_updated_at = CURRENT_TIMESTAMP")
	}

	// Always update updated_at
	updates = append(updates, "updated_at = CURRENT_TIMESTAMP")

	// Only update if there are fields to update
	if len(updates) > 0 {
		args = append(args, userID)
		query := "UPDATE users SET " + strings.Join(updates, ", ") + " WHERE id = ?"

		_, err := database.DB.Exec(query, args...)
		if err != nil {
			log.Printf("Error updating profile: %v", err)
			SendError(w, http.StatusInternalServerError, "Failed to update profile")
			return
		}
	}

	// Update tags if provided (sync so refetch after save sees them). Parameterized queries only (SQL injection protection).
	_, err = database.DB.Exec("DELETE FROM user_tags WHERE user_id = ?", userID)
	if err != nil {
		log.Printf("Error deleting tags: %v", err)
	} else if len(req.Tags) > 0 {
		for _, tag := range req.Tags {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				if len(tag) > MaxTagLength {
					SendError(w, http.StatusBadRequest, "Tag too long")
					return
				}
				_, err = database.DB.Exec("INSERT INTO user_tags (user_id, tag) VALUES (?, ?)", userID, tag)
				if err != nil {
					log.Printf("Error inserting tag '%s': %v", tag, err)
				}
			}
		}
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Profile updated successfully",
	})
}

// getUserIDFromRequest extracts user ID from Authorization header
func getUserIDFromRequest(r *http.Request) (int64, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return 0, errors.New("missing authorization header")
	}

	// Extract token from "Bearer <token>" format
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return 0, errors.New("invalid authorization header format")
	}

	token := parts[1]
	userID, err := services.ValidateToken(token)
	if err != nil {
		return 0, err
	}

	return userID, nil
}

// SetupCompleteAPI handles POST /api/profile/setup-complete
func SetupCompleteAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Update is_setup to 1 in database
	result, err := database.DB.Exec(
		"UPDATE users SET is_setup = 1 WHERE id = ?",
		userID,
	)
	if err != nil {
		log.Printf("Error updating is_setup: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to complete profile setup")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error checking rows affected: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to complete profile setup")
		return
	}

	if rowsAffected == 0 {
		SendError(w, http.StatusNotFound, "User not found")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message":  "Profile setup completed successfully",
		"is_setup": true,
	})
}

// ResetProfileAPI handles POST /api/profile/reset
func ResetProfileAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Reset all profile fields except: first_name, last_name, username, email, password_hash, is_email_verified
	// Set is_setup to 0 to require profile setup again
	_, err = database.DB.Exec(
		`UPDATE users SET 
			gender = NULL,
			sexual_preference = NULL,
			biography = NULL,
			birth_date = NULL,
			fame_rating = 0.0,
			latitude = NULL,
			longitude = NULL,
			location = NULL,
			is_setup = 0,
			profile_picture_id = NULL,
			openness = NULL,
			conscientiousness = NULL,
			extraversion = NULL,
			agreeableness = NULL,
			neuroticism = NULL,
			siblings = NULL,
			mbti = NULL,
			caliper_profile = NULL,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`,
		userID,
	)
	if err != nil {
		log.Printf("Error resetting profile: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to reset profile")
		return
	}

	// Delete user tags
	_, err = database.DB.Exec("DELETE FROM user_tags WHERE user_id = ?", userID)
	if err != nil {
		log.Printf("Error deleting tags during reset: %v", err)
		// Don't fail the reset if tag deletion fails
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Profile reset successfully",
	})
}

// ChangePasswordRequest represents password change request
type ChangePasswordRequest struct {
	NewPassword string `json:"new_password"`
}

// ChangePasswordAPI handles POST /api/profile/change-password
func ChangePasswordAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Parse request body
	var req ChangePasswordRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate password
	if req.NewPassword == "" {
		SendError(w, http.StatusBadRequest, "New password is required")
		return
	}

	if len(req.NewPassword) < 8 {
		SendError(w, http.StatusBadRequest, "Password must be at least 8 characters long")
		return
	}

	// Check for common words (any language)
	if services.IsCommonWord(req.NewPassword) {
		SendError(w, http.StatusBadRequest, "Password cannot be a commonly used word")
		return
	}

	// Hash the new password
	passwordHash, err := services.HashPassword(req.NewPassword)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Update password in database
	_, err = database.DB.Exec(
		"UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		passwordHash, userID,
	)
	if err != nil {
		log.Printf("Error updating password: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Password updated successfully",
	})
}

// UploadImageAPI handles POST /api/profile/upload-image
func UploadImageAPI(w http.ResponseWriter, r *http.Request) {
	// Ensure we always return JSON, even on panic
	defer func() {
		if rec := recover(); rec != nil {
			log.Printf("Panic in UploadImageAPI: %v", rec)
			SendError(w, http.StatusInternalServerError, "Internal server error")
		}
	}()

	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Parse multipart form (max 10MB)
	err = r.ParseMultipartForm(10 << 20) // 10MB
	if err != nil {
		SendError(w, http.StatusBadRequest, "Failed to parse form data")
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("image")
	if err != nil {
		SendError(w, http.StatusBadRequest, "No image file provided")
		return
	}
	defer file.Close()

	// Get slot and is_profile from form
	slotStr := r.FormValue("slot")
	slot, err := strconv.Atoi(slotStr)
	if err != nil || slot < 0 || slot >= 5 {
		SendError(w, http.StatusBadRequest, "Invalid slot number (must be 0-4)")
		return
	}

	isProfileStr := r.FormValue("is_profile")
	isProfile := isProfileStr == "1"

	// Validate file type
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	validExt := false
	for _, allowedExt := range allowedExts {
		if ext == allowedExt {
			validExt = true
			break
		}
	}
	if !validExt {
		SendError(w, http.StatusBadRequest, "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed")
		return
	}

	// Validate file size (max 10MB)
	if handler.Size > 10<<20 {
		SendError(w, http.StatusBadRequest, "File size exceeds 10MB limit")
		return
	}

	// Create organized directory structure: uploads/user_id/
	userUploadDir := filepath.Join("uploads", fmt.Sprintf("%d", userID))
	err = os.MkdirAll(userUploadDir, 0755)
	if err != nil {
		log.Printf("Error creating user upload directory: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Generate unique filename using random bytes + timestamp + slot
	// Format: {random_hex}_{timestamp}_{slot}{ext}
	randomBytes := make([]byte, 8)
	if _, err := rand.Read(randomBytes); err != nil {
		log.Printf("Error generating random bytes: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to generate filename")
		return
	}
	randomHex := hex.EncodeToString(randomBytes)
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%s_%d_%d%s", randomHex, timestamp, slot, ext)
	filePath := filepath.Join(userUploadDir, filename)	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("Error creating file: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		log.Printf("Error copying file: %v", err)
		os.Remove(filePath) // Clean up on error
		SendError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Get relative path for database: /uploads/user_id/filename
	relativePath := fmt.Sprintf("/uploads/%d/%s", userID, filename)

	// Check if image already exists at this slot
	var existingID int64
	var existingFilePath string
	err = database.DB.QueryRow(`
		SELECT id, file_path FROM user_pictures 
		WHERE user_id = ? AND order_index = ?
	`, userID, slot).Scan(&existingID, &existingFilePath)

	if err == nil {
		// Update existing image
		_, err = database.DB.Exec(`
			UPDATE user_pictures 
			SET file_path = ?, is_profile = ?
			WHERE id = ?
		`, relativePath, isProfile, existingID)
		if err != nil {
			log.Printf("Error updating image: %v", err)
			SendError(w, http.StatusInternalServerError, "Failed to update image")
			return
		}

		// Delete old file if it exists
		if existingFilePath != "" && !strings.HasPrefix(existingFilePath, "http") {
			// Remove leading /uploads/ to get relative path
			oldPath := strings.TrimPrefix(existingFilePath, "/uploads/")
			if oldPath != "" {
				fullOldPath := filepath.Join("uploads", oldPath)
				if err := os.Remove(fullOldPath); err != nil && !os.IsNotExist(err) {
					log.Printf("Warning: Failed to delete old file %s: %v", fullOldPath, err)
				}
			}
		}
	} else {
		// Insert new image
		_, err = database.DB.Exec(`
			INSERT INTO user_pictures (user_id, file_path, is_profile, order_index, created_at)
			VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
		`, userID, relativePath, isProfile, slot)
		if err != nil {
			log.Printf("Error inserting image: %v", err)
			SendError(w, http.StatusInternalServerError, "Failed to save image record")
			return
		}
	}

	// If this is the profile image, update user's profile_picture_id
	if isProfile {
		var pictureID int64
		err = database.DB.QueryRow(`
			SELECT id FROM user_pictures 
			WHERE user_id = ? AND order_index = 0
		`, userID).Scan(&pictureID)
		if err == nil {
			_, err = database.DB.Exec(`
				UPDATE users SET profile_picture_id = ? WHERE id = ?
			`, pictureID, userID)
			if err != nil {
				log.Printf("Error updating profile_picture_id: %v", err)
			}
		}
	}

	// Update fame rating for picture upload (async)
	go func() {
		if err := services.UpdateFameRating(userID); err != nil {
			log.Printf("Error updating fame rating for user %d: %v", userID, err)
		}
	}()

	SendSuccess(w, map[string]interface{}{
		"message":   "Image uploaded successfully",
		"file_path": relativePath,
	})
}

// ReorderImagesRequest represents image reorder request
type ReorderImagesRequest struct {
	Slot1 int `json:"slot1"`
	Slot2 int `json:"slot2"`
}

// ReorderImagesAPI handles POST /api/profile/reorder-images
func ReorderImagesAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Parse request body
	var req ReorderImagesRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate slots
	if req.Slot1 < 0 || req.Slot1 >= 5 || req.Slot2 < 0 || req.Slot2 >= 5 {
		SendError(w, http.StatusBadRequest, "Invalid slot numbers (must be 0-4)")
		return
	}

	if req.Slot1 == req.Slot2 {
		SendError(w, http.StatusBadRequest, "Slots must be different")
		return
	}

	// Get images at both slots
	var id1, id2 int64
	var filePath1, filePath2 string
	var isProfile1, isProfile2 int

	_ = database.DB.QueryRow(`
		SELECT id, file_path, is_profile FROM user_pictures 
		WHERE user_id = ? AND order_index = ?
	`, userID, req.Slot1).Scan(&id1, &filePath1, &isProfile1)

	_ = database.DB.QueryRow(`
		SELECT id, file_path, is_profile FROM user_pictures 
		WHERE user_id = ? AND order_index = ?
	`, userID, req.Slot2).Scan(&id2, &filePath2, &isProfile2)

	// Swap the order_index values
	// Use a temporary value to avoid conflicts
	_, err = database.DB.Exec(`
		UPDATE user_pictures 
		SET order_index = ? 
		WHERE user_id = ? AND order_index = ?
	`, -1, userID, req.Slot1)
	if err != nil {
		log.Printf("Error updating slot1: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to reorder images")
		return
	}

	_, err = database.DB.Exec(`
		UPDATE user_pictures 
		SET order_index = ? 
		WHERE user_id = ? AND order_index = ?
	`, req.Slot1, userID, req.Slot2)
	if err != nil {
		log.Printf("Error updating slot2: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to reorder images")
		return
	}

	_, err = database.DB.Exec(`
		UPDATE user_pictures 
		SET order_index = ? 
		WHERE user_id = ? AND order_index = ?
	`, req.Slot2, userID, -1)
	if err != nil {
		log.Printf("Error finalizing swap: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to reorder images")
		return
	}

	// If slot 0 (profile image) changed, update profile_picture_id
	if req.Slot1 == 0 || req.Slot2 == 0 {
		var pictureID int64
		err = database.DB.QueryRow(`
			SELECT id FROM user_pictures 
			WHERE user_id = ? AND order_index = 0
		`, userID).Scan(&pictureID)
		if err == nil {
			_, err = database.DB.Exec(`
				UPDATE users SET profile_picture_id = ? WHERE id = ?
			`, pictureID, userID)
			if err != nil {
				log.Printf("Error updating profile_picture_id: %v", err)
			}
		}
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Images reordered successfully",
	})
}

// ProfileVisitorsAPI handles GET /api/profile/visitors
func ProfileVisitorsAPI(w http.ResponseWriter, r *http.Request) {
	// Get user ID from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Get current user's location for distance calculation
	var userLat, userLng sql.NullFloat64
	database.DB.QueryRow("SELECT latitude, longitude FROM users WHERE id = ?", userID).Scan(&userLat, &userLng)

	// Get visitors (people who viewed this profile) - only first time for each
	rows, err := database.DB.Query(`
		SELECT 
			v.viewer_id,
			v.created_at as viewed_at,
			u.first_name,
			u.last_name,
			u.username,
			u.latitude,
			u.longitude,
			u.location,
			(SELECT file_path FROM user_pictures WHERE user_id = u.id AND is_profile = 1 AND order_index = 0 LIMIT 1) as profile_picture
		FROM views v
		INNER JOIN users u ON v.viewer_id = u.id
		INNER JOIN (
			SELECT viewer_id, MIN(created_at) as first_viewed_at
			FROM views
			WHERE viewed_id = ?
			GROUP BY viewer_id
		) first_views ON v.viewer_id = first_views.viewer_id AND v.created_at = first_views.first_viewed_at
		WHERE v.viewed_id = ?
		ORDER BY v.created_at DESC
		LIMIT 50
	`, userID, userID)

	if err != nil {
		log.Printf("Error querying visitors: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load visitors")
		return
	}
	defer rows.Close()

	visitors := []map[string]interface{}{}
	for rows.Next() {
		var visitor struct {
			ViewerID       int64
			ViewedAt       string
			FirstName      string
			LastName       string
			Username       string
			Latitude       sql.NullFloat64
			Longitude      sql.NullFloat64
			Location       sql.NullString
			ProfilePicture sql.NullString
		}

		err := rows.Scan(
			&visitor.ViewerID, &visitor.ViewedAt,
			&visitor.FirstName, &visitor.LastName, &visitor.Username,
			&visitor.Latitude, &visitor.Longitude, &visitor.Location,
			&visitor.ProfilePicture,
		)
		if err != nil {
			log.Printf("Error scanning visitor: %v", err)
			continue
		}

		// Calculate distance if both users have coordinates
		distance := -1.0
		if userLat.Valid && userLng.Valid && visitor.Latitude.Valid && visitor.Longitude.Valid {
			distance = calculateDistance(
				userLat.Float64, userLng.Float64,
				visitor.Latitude.Float64, visitor.Longitude.Float64,
			)
		}

		// Check if visitor liked current user
		var visitorLikedID int64
		var visitorLikedAt sql.NullString
		visitorLikedErr := database.DB.QueryRow(`
			SELECT l.id, l.created_at
			FROM likes l
			WHERE l.from_user_id = ? AND l.to_user_id = ?
		`, visitor.ViewerID, userID).Scan(&visitorLikedID, &visitorLikedAt)
		visitorLikedMe := (visitorLikedErr == nil)

		// Check if current user liked visitor back (mutual like = connected)
		var currentUserLikedID int64
		currentUserLikedErr := database.DB.QueryRow(`
			SELECT l.id
			FROM likes l
			WHERE l.from_user_id = ? AND l.to_user_id = ?
		`, userID, visitor.ViewerID).Scan(&currentUserLikedID)
		currentUserLikedThem := (currentUserLikedErr == nil)

		// Connected only if both liked each other
		isConnected := visitorLikedMe && currentUserLikedThem

		visitorData := map[string]interface{}{
			"viewer_id":       visitor.ViewerID,
			"first_name":      visitor.FirstName,
			"last_name":       visitor.LastName,
			"username":        visitor.Username,
			"viewed_at":       visitor.ViewedAt,
			"profile_picture": visitor.ProfilePicture.String,
			"distance":        distance,
			"is_connected":    isConnected,
			"gave_like":       visitorLikedMe && !currentUserLikedThem, // They liked me but I didn't like them back
		}

		if visitor.Location.Valid {
			visitorData["location"] = visitor.Location.String
		}
		if isConnected && visitorLikedAt.Valid {
			visitorData["connected_at"] = visitorLikedAt.String
		}

		visitors = append(visitors, visitorData)
	}

	SendSuccess(w, map[string]interface{}{
		"visitors": visitors,
	})
}

// calculateDistance calculates distance between two coordinates in kilometers using Haversine formula
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	// Convert to radians
	dLat := (lat2 - lat1) * (3.14159265359 / 180.0)
	dLon := (lon2 - lon1) * (3.14159265359 / 180.0)

	lat1Rad := lat1 * (3.14159265359 / 180.0)
	lat2Rad := lat2 * (3.14159265359 / 180.0)

	// Haversine formula
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*
			math.Cos(lat1Rad)*math.Cos(lat2Rad)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}
