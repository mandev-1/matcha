package handlers

import (
	"net/http"
	"strconv"

	"goji.io/pat"
)

// LikeAPI handles POST /api/like/:id
func LikeAPI(w http.ResponseWriter, r *http.Request) {
	userID := pat.Param(r.Context(), "id")
	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// TODO: Get current user from session
	// TODO: Process like action
	// TODO: Check if mutual like (connection)
	// TODO: Send notification

	SendSuccess(w, map[string]interface{}{
		"message":      "User liked successfully",
		"user_id":      id,
		"is_connected": false, // TODO: Check if mutual like
	})
}

// UnlikeAPI handles POST /api/unlike/:id
func UnlikeAPI(w http.ResponseWriter, r *http.Request) {
	userID := pat.Param(r.Context(), "id")
	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// TODO: Get current user from session
	// TODO: Process unlike action
	// TODO: Disable chat if connected
	// TODO: Send notification

	SendSuccess(w, map[string]interface{}{
		"message": "User unliked successfully",
		"user_id": id,
	})
}


