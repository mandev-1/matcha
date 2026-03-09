package services

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"matcha/internal/config"
	"matcha/internal/database"
	"matcha/internal/models"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Common words in multiple languages that should not be accepted as passwords
var commonWords = []string{
	// English
	"password", "password123", "12345678", "123456789", "qwerty", "abc123",
	"password1", "welcome", "monkey", "1234567", "letmein", "trustno1",
	"dragon", "baseball", "iloveyou", "master", "sunshine", "ashley",
	"bailey", "passw0rd", "shadow", "123123", "654321", "superman",
	"qazwsx", "michael", "football", "jesus", "ninja",
	"mustang", "princess", "qwerty123", "solo", "starwars",
	"hello", "hello123", "welcome123", "admin", "admin123", "root",
	"test", "test123", "guest", "user", "demo", "sample",
	// Russian
	"пароль", "пароль123", "привет", "привет123", "админ", "админ123",
	"йцукен", "пользователь", "тест", "тест123",
	// Spanish
	"contraseña", "contrasena", "contraseña123", "hola", "hola123",
	// French
	"motdepasse", "motdepasse123", "bonjour", "bonjour123",
	// German
	"passwort", "passwort123", "hallo", "hallo123",
	// Chinese (pinyin)
	"mima", "mima123", "admin", "nihao",
	// Japanese (romaji)
	"pasuwaado", "password123",
}

// IsCommonWord checks if a password is a commonly used word in any language
func IsCommonWord(password string) bool {
	// Exception for dev password
	if password == "Test1234" {
		return false
	}
	lowerPassword := strings.ToLower(password)
	for _, word := range commonWords {
		if lowerPassword == word || strings.Contains(lowerPassword, word) {
			return true
		}
	}
	return false
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword compares a password with a hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateVerificationToken generates a random token for email verification
func GenerateVerificationToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// CreateUser creates a new user in the database
func CreateUser(username, email, password, firstName, lastName string) (*models.User, string, error) {
	// Check if username already exists
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", username).Scan(&count)
	if err != nil {
		return nil, "", fmt.Errorf("database error: %v", err)
	}
	if count > 0 {
		return nil, "", fmt.Errorf("username already exists")
	}

	// Check if email already exists
	err = database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", email).Scan(&count)
	if err != nil {
		return nil, "", fmt.Errorf("database error: %v", err)
	}
	if count > 0 {
		return nil, "", fmt.Errorf("email already exists")
	}

	// Hash password
	passwordHash, err := HashPassword(password)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash password: %v", err)
	}

	// Generate verification token
	token, err := GenerateVerificationToken()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %v", err)
	}

	// Insert user with initial fame rating of 1.0 (Level 1)
	result, err := database.DB.Exec(
		`INSERT INTO users (username, email, password_hash, first_name, last_name, email_verification_token, is_setup, is_email_verified, fame_rating, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
		username, email, passwordHash, firstName, lastName, token,
	)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create user: %v", err)
	}

	userID, err := result.LastInsertId()
	if err != nil {
		return nil, "", fmt.Errorf("failed to get user ID: %v", err)
	}

	user := &models.User{
		ID:                    userID,
		Username:              username,
		Email:                 email,
		FirstName:             firstName,
		LastName:              lastName,
		EmailVerificationToken: token,
		IsSetup:              false,
		IsEmailVerified:      false,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	return user, token, nil
}

// VerifyUser verifies a user's email using the token
func VerifyUser(token string) error {
	result, err := database.DB.Exec(
		"UPDATE users SET is_email_verified = 1, email_verification_token = NULL WHERE email_verification_token = ?",
		token,
	)
	if err != nil {
		return fmt.Errorf("database error: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("invalid or expired token")
	}

	return nil
}

// AuthenticateUser authenticates a user by username and returns the user if successful
// Returns user even if email is not verified (check IsEmailVerified field)
func AuthenticateUser(username, password string) (*models.User, error) {
	var user models.User
	var passwordHash string
	var isEmailVerified, isSetup int

	err := database.DB.QueryRow(
		`SELECT id, username, email, password_hash, first_name, last_name, is_email_verified, is_setup, created_at, updated_at
		 FROM users WHERE username = ?`,
		username,
	).Scan(
		&user.ID, &user.Username, &user.Email, &passwordHash, &user.FirstName, &user.LastName,
		&isEmailVerified, &isSetup, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("invalid username or password")
	}

	// Check password
	if !CheckPassword(password, passwordHash) {
		return nil, fmt.Errorf("invalid username or password")
	}

	user.IsEmailVerified = isEmailVerified == 1
	user.IsSetup = isSetup == 1

	return &user, nil
}

// ResendVerificationEmail generates a new token and sends verification email
func ResendVerificationEmail(username string, cfg *config.Config) error {
	// Get user by username
	var userID int64
	var email string
	var currentToken string

	err := database.DB.QueryRow(
		"SELECT id, email, email_verification_token FROM users WHERE username = ?",
		username,
	).Scan(&userID, &email, &currentToken)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	// Generate new verification token
	token, err := GenerateVerificationToken()
	if err != nil {
		return fmt.Errorf("failed to generate token: %v", err)
	}

	// Update token in database
	_, err = database.DB.Exec(
		"UPDATE users SET email_verification_token = ? WHERE id = ?",
		token, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update token: %v", err)
	}

	// Send verification email (using the email service function)
	if err := SendVerificationEmail(cfg, email, token); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

// GeneratePasswordResetCode returns a 6-digit numeric code
func GeneratePasswordResetCode() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	n := uint32(b[0])<<16 | uint32(b[1])<<8 | uint32(b[2])
	return fmt.Sprintf("%06d", n%1000000), nil
}

// ForgotPasswordSendCode looks up user by email, generates a 6-digit code, stores it with 15min expiry, and sends email
func ForgotPasswordSendCode(email string, cfg *config.Config) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return fmt.Errorf("email is required")
	}
	var userID int64
	err := database.DB.QueryRow("SELECT id FROM users WHERE email = ?", email).Scan(&userID)
	if err != nil {
		return fmt.Errorf("no account found with this email")
	}
	code, err := GeneratePasswordResetCode()
	if err != nil {
		return fmt.Errorf("failed to generate code: %v", err)
	}
	expires := time.Now().UTC().Add(15 * time.Minute)
	_, err = database.DB.Exec(
		"UPDATE users SET password_reset_code = ?, password_reset_expires_at = ?, password_reset_token = NULL WHERE id = ?",
		code, expires, userID,
	)
	if err != nil {
		return fmt.Errorf("database error: %v", err)
	}
	if err := SendPasswordResetCode(cfg, email, code); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	return nil
}

// ForgotPasswordVerify verifies the 6-digit code for the given email; on success returns a reset token
func ForgotPasswordVerify(email, code string) (resetToken string, err error) {
	email = strings.TrimSpace(strings.ToLower(email))
	code = strings.TrimSpace(code)
	if email == "" || code == "" {
		return "", fmt.Errorf("email and code are required")
	}
	if len(code) != 6 {
		return "", fmt.Errorf("code must be 6 digits")
	}
	var userID int64
	var storedCode string
	var expires *time.Time
	err = database.DB.QueryRow(
		"SELECT id, password_reset_code, password_reset_expires_at FROM users WHERE email = ?",
		email,
	).Scan(&userID, &storedCode, &expires)
	if err != nil || storedCode == "" {
		return "", fmt.Errorf("invalid or expired code")
	}
	if expires != nil && time.Now().UTC().After(*expires) {
		_, _ = database.DB.Exec("UPDATE users SET password_reset_code = NULL, password_reset_expires_at = NULL WHERE id = ?", userID)
		return "", fmt.Errorf("code has expired")
	}
	if storedCode != code {
		return "", fmt.Errorf("invalid code")
	}
	resetToken, err = GenerateVerificationToken()
	if err != nil {
		return "", fmt.Errorf("failed to generate reset token: %v", err)
	}
	_, err = database.DB.Exec(
		"UPDATE users SET password_reset_code = NULL, password_reset_expires_at = NULL, password_reset_token = ? WHERE id = ?",
		resetToken, userID,
	)
	if err != nil {
		return "", fmt.Errorf("database error: %v", err)
	}
	return resetToken, nil
}

// ForgotPasswordReset sets a new password using the reset token, then clears the token
func ForgotPasswordReset(resetToken, newPassword string) error {
	resetToken = strings.TrimSpace(resetToken)
	if resetToken == "" || newPassword == "" {
		return fmt.Errorf("reset token and new password are required")
	}
	if len(newPassword) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	if IsCommonWord(newPassword) {
		return fmt.Errorf("password cannot be a commonly used word")
	}
	hash, err := HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}
	// Only update if token exists and is not expired (expires_at NULL = no expiry, e.g. from code flow)
	res, err := database.DB.Exec(
		"UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE password_reset_token = ? AND (password_reset_expires_at IS NULL OR password_reset_expires_at > datetime('now'))",
		hash, resetToken,
	)
	if err != nil {
		return fmt.Errorf("database error: %v", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("invalid or expired reset link")
	}
	return nil
}

// SendPasswordResetLinkForUser generates a reset token for the given user, stores it with expiry, and sends an email with the reset link. Used when the user is logged in (e.g. from Profile).
func SendPasswordResetLinkForUser(userID int64, cfg *config.Config) error {
	var email string
	err := database.DB.QueryRow("SELECT email FROM users WHERE id = ?", userID).Scan(&email)
	if err != nil || email == "" {
		return fmt.Errorf("user not found")
	}
	resetToken, err := GenerateVerificationToken()
	if err != nil {
		return fmt.Errorf("failed to generate reset token: %v", err)
	}
	expires := time.Now().UTC().Add(15 * time.Minute)
	_, err = database.DB.Exec(
		"UPDATE users SET password_reset_code = NULL, password_reset_expires_at = ?, password_reset_token = ? WHERE id = ?",
		expires, resetToken, userID,
	)
	if err != nil {
		return fmt.Errorf("database error: %v", err)
	}
	resetLink := strings.TrimSuffix(cfg.FrontendURL, "/") + "/reset-password?token=" + resetToken
	if err := SendPasswordResetLink(cfg, email, resetLink); err != nil {
		return err
	}
	return nil
}

