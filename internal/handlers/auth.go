package handlers

import (
	"log"
	"net/http"
	"matcha/internal/config"
	"matcha/internal/services"
)

// RegisterRequest represents registration request
type RegisterRequest struct {
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// RegisterAPI handles registration API endpoint
func RegisterAPI(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Username == "" || req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		SendError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	// Validate password strength (basic check - at least 8 characters)
	if len(req.Password) < 8 {
		SendError(w, http.StatusBadRequest, "Password must be at least 8 characters long")
		return
	}

	// Create user
	cfg := config.Load()
	user, token, err := services.CreateUser(req.Username, req.Email, req.Password, req.FirstName, req.LastName)
	if err != nil {
		if err.Error() == "username already exists" {
			SendError(w, http.StatusConflict, "Username already taken")
			return
		}
		if err.Error() == "email already exists" {
			SendError(w, http.StatusConflict, "Email already registered")
			return
		}
		log.Printf("Error creating user: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to create account")
		return
	}

	// Send verification email
	if err := services.SendVerificationEmail(cfg, user.Email, token); err != nil {
		log.Printf("Error sending verification email: %v", err)
		// Don't fail registration if email fails - user can request resend
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Registration successful. Please check your email for verification.",
		"user_id": user.ID,
	})
}

// LoginAPI handles login API endpoint
func LoginAPI(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input - just check required fields
	if req.Username == "" {
		SendError(w, http.StatusBadRequest, "Username is required")
		return
	}

	if req.Password == "" {
		SendError(w, http.StatusBadRequest, "Password is required")
		return
	}

	// Authenticate user - this will check if username exists and password matches
	user, err := services.AuthenticateUser(req.Username, req.Password)
	if err != nil {
		SendError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Check if email is verified
	if !user.IsEmailVerified {
		SendSuccess(w, map[string]interface{}{
			"email_verified": false,
			"message":        "Email not verified",
			"username":       user.Username,
		})
		return
	}

	// Generate JWT token
	token, err := services.GenerateToken(user.ID)
	if err != nil {
		log.Printf("Error generating token: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to generate session")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":            user.ID,
			"email":         user.Email,
			"set_up":        user.SetUp,
			"email_verified": true,
		},
	})
}

// ResendVerificationAPI handles resending verification email
func ResendVerificationAPI(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
	}
	if err := ParseJSONBody(r, &req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Username == "" {
		SendError(w, http.StatusBadRequest, "Username is required")
		return
	}

	cfg := config.Load()
	if err := services.ResendVerificationEmail(req.Username, cfg); err != nil {
		if err.Error() == "user not found" {
			SendError(w, http.StatusNotFound, "User not found")
			return
		}
		log.Printf("Error resending verification email: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to resend verification email")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Verification email sent successfully",
	})
}

// VerifyEmailAPI handles email verification endpoint
func VerifyEmailAPI(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		SendError(w, http.StatusBadRequest, "Verification token is required")
		return
	}

	if err := services.VerifyUser(token); err != nil {
		SendError(w, http.StatusBadRequest, err.Error())
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Email verified successfully",
	})
}

// LogoutAPI handles logout API endpoint
func LogoutAPI(w http.ResponseWriter, r *http.Request) {
	// JWT tokens are stateless, so logout is handled client-side by removing the token
	SendSuccess(w, map[string]interface{}{
		"message": "Logged out successfully",
	})
}
