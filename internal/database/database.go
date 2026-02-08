package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// Init initializes the database connection
func Init(dbPath string) error {
	var err error
	// Enable WAL mode for better concurrency (allows concurrent reads)
	// Use _journal_mode=WAL to enable Write-Ahead Logging
	DB, err = sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return err
	}

	// Set connection pool settings for better concurrency
	DB.SetMaxOpenConns(25) // Allow multiple connections
	DB.SetMaxIdleConns(5)  // Keep some connections idle
	DB.SetConnMaxLifetime(0) // Don't close connections based on time

	// Test connection
	if err = DB.Ping(); err != nil {
		return err
	}

	// Enable WAL mode explicitly
	_, err = DB.Exec("PRAGMA journal_mode=WAL")
	if err != nil {
		log.Printf("Warning: Could not enable WAL mode: %v", err)
	}

	// Set busy timeout to handle locks gracefully
	_, err = DB.Exec("PRAGMA busy_timeout=5000")
	if err != nil {
		log.Printf("Warning: Could not set busy timeout: %v", err)
	}

	// Initialize write queue for concurrent write safety
	InitWriteQueue(DB)

	log.Println("Database connection established (WAL mode enabled)")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
