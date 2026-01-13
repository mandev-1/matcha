package handlers

import (
	"net/http"
	"strconv"

	"goji.io/pat"
)

// ChatListAPI handles GET /api/chat
func ChatListAPI(w http.ResponseWriter, r *http.Request) {
	// TODO: Get current user from session
	// TODO: Get all connected users
	// TODO: Get unread message counts

	// Mock response
	SendSuccess(w, map[string]interface{}{
		"conversations": []interface{}{
			map[string]interface{}{
				"id":           1,
				"name":         "Jane Smith",
				"avatar":       "",
				"last_message": "Hey! How are you?",
				"unread_count": 2,
			},
		},
	})
}

// MessagesAPI handles GET /api/messages/:id
func MessagesAPI(w http.ResponseWriter, r *http.Request) {
	chatID := pat.Param(r.Context(), "id")
	id, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		SendError(w, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	// TODO: Get current user from session
	// TODO: Load message history for this chat

	// Mock response
	SendSuccess(w, map[string]interface{}{
		"messages": []interface{}{
			map[string]interface{}{
				"id":                   1,
				"content":              "Hey! How are you?",
				"is_from_current_user": false,
				"created_at":           "2024-01-01T10:00:00Z",
			},
		},
		"chat_id": id,
	})
}

// SendMessageAPI handles POST /api/messages/:id
func SendMessageAPI(w http.ResponseWriter, r *http.Request) {
	chatID := pat.Param(r.Context(), "id")
	id, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		SendError(w, http.StatusBadRequest, "Invalid chat ID")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TODO: Get current user from session
	// TODO: Save message to database
	// TODO: Send real-time notification

	SendSuccess(w, map[string]interface{}{
		"message": "Message sent successfully",
		"chat_id": id,
	})
}
