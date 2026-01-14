package config

import (
	"os"
)

// Config holds application configuration
type Config struct {
	Port      string
	DBPath    string
	SMTPHost  string
	SMTPPort  string
	SMTPUser  string
	SMTPPass  string
	FromEmail string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:      getEnv("PORT", "8080"),
		DBPath:    getEnv("DB_PATH", "data/matcha.db"),
		SMTPHost:  getEnv("SMTP_HOST", "localhost"), // Use localhost for local dev, mailhog for Docker
		SMTPPort:  getEnv("SMTP_PORT", "1025"),
		SMTPUser:  getEnv("SMTP_USER", ""),
		SMTPPass:  getEnv("SMTP_PASS", ""),
		FromEmail: getEnv("FROM_EMAIL", "noreply@matcha.local"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
