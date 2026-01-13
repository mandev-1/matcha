package handlers

import (
	"encoding/json"
	"net/http"
)

// JSONResponse is a helper for JSON responses
type JSONResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SendJSON sends a JSON response
func SendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// SendSuccess sends a success JSON response
func SendSuccess(w http.ResponseWriter, data interface{}) {
	SendJSON(w, http.StatusOK, JSONResponse{
		Success: true,
		Data:    data,
	})
}

// SendError sends an error JSON response
func SendError(w http.ResponseWriter, status int, message string) {
	SendJSON(w, status, JSONResponse{
		Success: false,
		Error:   message,
	})
}

// ParseJSONBody parses JSON from request body
func ParseJSONBody(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

