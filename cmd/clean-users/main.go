package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Open database
	db, err := sql.Open("sqlite3", "./data/matcha.db")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Cleaning up test users (is_bot = 1)...")

	// Delete user tags for bot users
	result, err := db.Exec(`
		DELETE FROM user_tags 
		WHERE user_id IN (SELECT id FROM users WHERE is_bot = 1)
	`)
	if err != nil {
		log.Fatalf("Error deleting user tags: %v", err)
	}
	tagsDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d user tags", tagsDeleted)

	// Delete user pictures for bot users
	result, err = db.Exec(`
		DELETE FROM user_pictures 
		WHERE user_id IN (SELECT id FROM users WHERE is_bot = 1)
	`)
	if err != nil {
		log.Fatalf("Error deleting user pictures: %v", err)
	}
	picturesDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d user pictures", picturesDeleted)

	// Delete likes involving bot users
	result, err = db.Exec(`
		DELETE FROM likes 
		WHERE from_user_id IN (SELECT id FROM users WHERE is_bot = 1)
		   OR to_user_id IN (SELECT id FROM users WHERE is_bot = 1)
	`)
	if err != nil {
		log.Fatalf("Error deleting likes: %v", err)
	}
	likesDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d likes", likesDeleted)

	// Delete views involving bot users
	result, err = db.Exec(`
		DELETE FROM views 
		WHERE viewer_id IN (SELECT id FROM users WHERE is_bot = 1)
		   OR viewed_id IN (SELECT id FROM users WHERE is_bot = 1)
	`)
	if err != nil {
		log.Fatalf("Error deleting views: %v", err)
	}
	viewsDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d views", viewsDeleted)

	// Delete messages involving bot users
	result, err = db.Exec(`
		DELETE FROM messages 
		WHERE from_user_id IN (SELECT id FROM users WHERE is_bot = 1)
		   OR to_user_id IN (SELECT id FROM users WHERE is_bot = 1)
	`)
	if err != nil {
		log.Fatalf("Error deleting messages: %v", err)
	}
	messagesDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d messages", messagesDeleted)

	// Delete notifications for bot users
	result, err = db.Exec(`
		DELETE FROM notifications 
		WHERE user_id IN (SELECT id FROM users WHERE is_bot = 1)
	`)
	if err != nil {
		log.Fatalf("Error deleting notifications: %v", err)
	}
	notificationsDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d notifications", notificationsDeleted)

	// Finally, delete bot users
	result, err = db.Exec("DELETE FROM users WHERE is_bot = 1")
	if err != nil {
		log.Fatalf("Error deleting bot users: %v", err)
	}
	usersDeleted, _ := result.RowsAffected()
	log.Printf("Deleted %d bot users", usersDeleted)

	log.Println("Cleanup complete!")
}
