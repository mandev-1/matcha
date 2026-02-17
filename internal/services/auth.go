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

