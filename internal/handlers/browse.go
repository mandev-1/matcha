package handlers

import (
	"net/http"
	"strconv"

	"goji.io/pat"
)

// BrowseAPI handles GET /api/browse
func BrowseAPI(w http.ResponseWriter, r *http.Request) {
	// Get query parameters
	sort := r.URL.Query().Get("sort")
	minAge := r.URL.Query().Get("minAge")
	maxAge := r.URL.Query().Get("maxAge")

	// TODO: Get current user from session
	// TODO: Query matching profiles based on:
	//   - Gender/sexual preferences
	//   - Location proximity
	//   - Shared tags
	//   - Fame rating
	// TODO: Apply sorting and filtering

	// Mock response
	profiles := []map[string]interface{}{
		{
			"id":              1,
			"first_name":      "Jane",
			"age":             28,
			"location":        "San Francisco",
			"fame_rating":     4.8,
			"profile_picture": "",
			"tags":            []string{"#yoga", "#travel"},
		},
		{
			"id":              2,
			"first_name":      "Alice",
			"age":             25,
			"location":        "Oakland",
			"fame_rating":     4.2,
			"profile_picture": "",
			"tags":            []string{"#music", "#art"},
		},
	}

	SendSuccess(w, map[string]interface{}{
		"profiles": profiles,
		"sort":     sort,
		"minAge":   minAge,
		"maxAge":   maxAge,
	})
}

// SearchAPI handles GET /api/search
func SearchAPI(w http.ResponseWriter, r *http.Request) {
	// TODO: Get search criteria from query params
	// TODO: Return matching profiles

	SendSuccess(w, map[string]interface{}{
		"profiles": []interface{}{},
	})
}

// UserProfileAPI handles GET /api/user/:id
func UserProfileAPI(w http.ResponseWriter, r *http.Request) {
	userID := pat.Param(r.Context(), "id")
	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// TODO: Load user profile from database
	// TODO: Record visit in history
	// TODO: Check if liked/connected

	// Mock response
	SendSuccess(w, map[string]interface{}{
		"id":              id,
		"first_name":      "Jane",
		"last_name":       "Smith",
		"age":             28,
		"location":        "San Francisco",
		"biography":       "Love yoga and traveling",
		"fame_rating":     4.8,
		"is_online":       true,
		"last_seen":       "",
		"profile_picture": "",
		"tags":            []string{"#yoga", "#travel"},
		"is_liked":        false,
		"is_connected":    false,
	})
}
