package handlers

import (
	"net/http"
)

// RegisterRequest represents registration request
type RegisterRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RegisterAPI handles registration API endpoint
func RegisterAPI(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TODO: Validate input
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		SendError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	// TODO: Check if email exists
	// TODO: Hash password
	// TODO: Create user account
	// TODO: Send verification email via mailhog

	SendSuccess(w, map[string]interface{}{
		"message": "Registration successful. Please check your email for verification.",
	})
}

// LoginAPI handles login API endpoint
func LoginAPI(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TODO: Validate credentials
	// TODO: Create session/token
	// TODO: Return user data and token

	// For now, return success (implement actual auth later)
	SendSuccess(w, map[string]interface{}{
		"token": "dummy-token",
		"user": map[string]interface{}{
			"id":    1,
			"email": req.Email,
		},
	})
}

// LogoutAPI handles logout API endpoint
func LogoutAPI(w http.ResponseWriter, r *http.Request) {
	// TODO: Destroy session/token
	SendSuccess(w, map[string]interface{}{
		"message": "Logged out successfully",
	})
}
