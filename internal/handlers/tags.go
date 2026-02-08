package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strings"

	"matcha/internal/database"
)

// PopularTagsAPI handles GET /api/tags/popular
func PopularTagsAPI(w http.ResponseWriter, r *http.Request) {
	// Get top 5 most popular tags with user counts
	rows, err := database.DB.Query(`
		SELECT tag, COUNT(DISTINCT user_id) as user_count
		FROM user_tags
		WHERE tag IS NOT NULL AND tag != ''
		GROUP BY tag
		ORDER BY user_count DESC
		LIMIT 5
	`)
	if err != nil {
		log.Printf("Error querying popular tags: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load popular tags")
		return
	}
	defer rows.Close()

	popularTags := []map[string]interface{}{}
	for rows.Next() {
		var tag string
		var userCount int64

		err := rows.Scan(&tag, &userCount)
		if err != nil {
			log.Printf("Error scanning popular tag: %v", err)
			continue
		}

		popularTags = append(popularTags, map[string]interface{}{
			"tag":        tag,
			"user_count": userCount,
		})
	}

	SendSuccess(w, map[string]interface{}{
		"popular_tags": popularTags,
	})
}

// AddTagAPI handles POST /api/tags/add
func AddTagAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Parse request body
	var req struct {
		Tag string `json:"tag"`
	}
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Normalize tag (ensure it starts with #)
	tag := strings.TrimSpace(req.Tag)
	if tag == "" {
		SendError(w, http.StatusBadRequest, "Tag cannot be empty")
		return
	}
	if !strings.HasPrefix(tag, "#") {
		tag = "#" + tag
	}

	// Check if user already has 5 tags
	var tagCount int64
	err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM user_tags WHERE user_id = ?
	`, currentUserID).Scan(&tagCount)
	if err != nil {
		log.Printf("Error counting user tags: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to check tag count")
		return
	}

	if tagCount >= 5 {
		SendError(w, http.StatusBadRequest, "Maximum of 5 tags allowed")
		return
	}

	// Check if tag already exists for user
	var existingTagID int64
	err = database.DB.QueryRow(`
		SELECT id FROM user_tags WHERE user_id = ? AND tag = ?
	`, currentUserID, tag).Scan(&existingTagID)

	if err == nil {
		// Tag already exists
		SendSuccess(w, map[string]interface{}{
			"message": "Tag already exists",
			"tag":     tag,
		})
		return
	} else if err != sql.ErrNoRows {
		log.Printf("Error checking existing tag: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to check tag")
		return
	}

	// Insert tag
	_, err = database.DB.Exec(`
		INSERT INTO user_tags (user_id, tag)
		VALUES (?, ?)
	`, currentUserID, tag)
	if err != nil {
		log.Printf("Error inserting tag: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to add tag")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Tag added successfully",
		"tag":     tag,
	})
}

// RemoveTagAPI handles POST /api/tags/remove
func RemoveTagAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Parse request body
	var req struct {
		Tag string `json:"tag"`
	}
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Normalize tag (ensure it starts with #)
	tag := strings.TrimSpace(req.Tag)
	if tag == "" {
		SendError(w, http.StatusBadRequest, "Tag cannot be empty")
		return
	}
	if !strings.HasPrefix(tag, "#") {
		tag = "#" + tag
	}

	// Delete tag
	result, err := database.DB.Exec(`
		DELETE FROM user_tags WHERE user_id = ? AND tag = ?
	`, currentUserID, tag)
	if err != nil {
		log.Printf("Error deleting tag: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to remove tag")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
	}

	if rowsAffected == 0 {
		SendSuccess(w, map[string]interface{}{
			"message": "Tag was not found",
			"tag":     tag,
		})
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Tag removed successfully",
		"tag":     tag,
	})
}

// UserTagMatchAPI handles GET /api/tags/user-match
func UserTagMatchAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID from authentication token
	currentUserID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Get user's tags
	userTagRows, err := database.DB.Query(`
		SELECT tag FROM user_tags WHERE user_id = ?
	`, currentUserID)
	if err != nil {
		log.Printf("Error querying user tags: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to check tag matches")
		return
	}
	defer userTagRows.Close()

	userTags := []string{}
	for userTagRows.Next() {
		var tag string
		if err := userTagRows.Scan(&tag); err == nil {
			userTags = append(userTags, tag)
		}
	}

	// If user has no tags, they have no matches
	if len(userTags) == 0 {
		SendSuccess(w, map[string]interface{}{
			"has_matching_tags": false,
			"tag_count":         0,
			"has_too_many_tags": false,
		})
		return
	}

	// Check if any other users have matching tags (case-insensitive comparison)
	var matchCount int64
	err = database.DB.QueryRow(`
		SELECT COUNT(DISTINCT ut.user_id)
		FROM user_tags ut
		INNER JOIN user_tags user_tags ON LOWER(TRIM(ut.tag)) = LOWER(TRIM(user_tags.tag))
		WHERE ut.user_id != ? 
		AND user_tags.user_id = ?
		AND ut.user_id IN (SELECT id FROM users WHERE is_setup = 1 AND is_email_verified = 1)
	`, currentUserID, currentUserID).Scan(&matchCount)
	if err != nil {
		log.Printf("Error checking tag matches: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to check tag matches")
		return
	}

	hasMatchingTags := matchCount > 0
	hasTooManyTags := len(userTags) >= 5

	SendSuccess(w, map[string]interface{}{
		"has_matching_tags": hasMatchingTags,
		"tag_count":         len(userTags),
		"has_too_many_tags": hasTooManyTags,
		"match_count":       matchCount,
	})
}
