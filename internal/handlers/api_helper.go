package handlers

import (
	"encoding/json"
	"net/http"
)

// Input length limits for SQL injection / DoS protection (all DB writes use parameterized queries only).
const (
	MaxMessageContentLength = 4096   // chat message
	MaxBiographyLength      = 2000  // profile bio
	MaxTagLength            = 64    // single tag (e.g. #hiking)
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

// HealthAPI handles GET /api/health - no auth required, returns 200 when server is up
func HealthAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(JSONResponse{Success: true, Data: map[string]string{"status": "ok"}})
}
