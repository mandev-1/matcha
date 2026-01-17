package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"

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
	}

	err = database.DB.QueryRow(`
		SELECT 
			id, username, email, first_name, last_name,
			gender, sexual_preference, biography, birth_date,
			location, fame_rating, is_setup,
			openness, conscientiousness, extraversion, agreeableness, neuroticism,
			siblings, mbti, caliper_profile
		FROM users 
		WHERE id = ?
	`, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName,
		&user.Gender, &user.SexualPreference, &user.Biography, &user.BirthDate,
		&user.Location, &user.FameRating, &user.IsSetup,
		&user.Openness, &user.Conscientiousness, &user.Extraversion, &user.Agreeableness, &user.Neuroticism,
		&user.Siblings, &user.MBTI, &user.CaliperProfile,
	)

	if err != nil {
		log.Printf("Error loading profile: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load profile")
		return
	}

	// Build response
	response := map[string]interface{}{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"fame_rating": user.FameRating,
		"is_setup":   user.IsSetup,
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

	SendSuccess(w, response)
}

// ProfileUpdateRequest represents profile update request
type ProfileUpdateRequest struct {
	FirstName         string            `json:"first_name"`
	LastName          string            `json:"last_name"`
	Email             string            `json:"email"`
	Gender            string            `json:"gender"`
	SexualPreference  string            `json:"sexual_preference"`
	Biography         string            `json:"biography"`
	BigFive           map[string]string `json:"big_five"`
	Siblings          string            `json:"siblings"`
	MBTI              string            `json:"mbti"`
	CaliperProfile    string            `json:"caliper_profile"`
	Tags              []string          `json:"tags"`
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

	// Update tags if provided
	if req.Tags != nil {
		// Delete existing tags
		_, err := database.DB.Exec("DELETE FROM user_tags WHERE user_id = ?", userID)
		if err != nil {
			log.Printf("Error deleting tags: %v", err)
		} else {
			// Insert new tags
			for _, tag := range req.Tags {
				if tag != "" {
					_, err := database.DB.Exec("INSERT OR IGNORE INTO user_tags (user_id, tag) VALUES (?, ?)", userID, tag)
					if err != nil {
						log.Printf("Error inserting tag: %v", err)
					}
				}
			}
		}
	}

	// Also delete user tags when resetting profile
	_, err = database.DB.Exec("DELETE FROM user_tags WHERE user_id = ?", userID)
	if err != nil {
		log.Printf("Error deleting tags during reset: %v", err)
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
		"message": "Profile setup completed successfully",
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


