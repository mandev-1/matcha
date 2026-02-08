package services

import (
	"database/sql"
	"log"
	"math"

	"matcha/internal/database"
)

// FameRatingService handles fame rating calculations and updates
// Fame rating is level-based: Level = floor(fame_rating)
// Users start at Level 1 (fame_rating = 1.0)

const (
	// Base level - all users start at level 1
	BaseFameRating = 1.0

	// Fame points for different activities
	PointsForLiking        = 0.5  // When you like someone
	PointsForReceivingLike = 1.0  // When someone likes you
	PointsForMessage       = 0.1  // Per message sent
	PointsForPicture       = 0.3  // Per picture uploaded (max 5 pictures = 1.5 points)
	PointsForConnection    = 2.0  // When you get a mutual like (connection)
	PointsForProfileView   = 0.05 // When someone views your profile
)

// CalculateFameRating calculates the current fame rating for a user based on their activity
func CalculateFameRating(userID int64) (float64, error) {
	baseRating := BaseFameRating

	// Count likes given
	var likesGiven int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM likes WHERE from_user_id = ?
	`, userID).Scan(&likesGiven)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error counting likes given: %v", err)
		return baseRating, err
	}
	baseRating += float64(likesGiven) * PointsForLiking

	// Count likes received
	var likesReceived int
	err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM likes WHERE to_user_id = ?
	`, userID).Scan(&likesReceived)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error counting likes received: %v", err)
		return baseRating, err
	}
	baseRating += float64(likesReceived) * PointsForReceivingLike

	// Count messages sent
	var messagesSent int
	err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM messages WHERE from_user_id = ?
	`, userID).Scan(&messagesSent)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error counting messages sent: %v", err)
		return baseRating, err
	}
	baseRating += float64(messagesSent) * PointsForMessage

	// Count pictures uploaded (max 5)
	var pictureCount int
	err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM user_pictures WHERE user_id = ?
	`, userID).Scan(&pictureCount)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error counting pictures: %v", err)
		return baseRating, err
	}
	// Cap at 5 pictures for fame points
	if pictureCount > 5 {
		pictureCount = 5
	}
	baseRating += float64(pictureCount) * PointsForPicture

	// Count connections (mutual likes)
	// A connection exists when user A likes user B AND user B likes user A
	var connections int
	err = database.DB.QueryRow(`
		SELECT COUNT(*)
		FROM likes l1
		INNER JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
		WHERE l1.from_user_id = ?
	`, userID).Scan(&connections)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error counting connections: %v", err)
		return baseRating, err
	}
	baseRating += float64(connections) * PointsForConnection

	// Count profile views received
	var viewsReceived int
	err = database.DB.QueryRow(`
		SELECT COUNT(*) FROM views WHERE viewed_id = ?
	`, userID).Scan(&viewsReceived)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error counting views received: %v", err)
		return baseRating, err
	}
	baseRating += float64(viewsReceived) * PointsForProfileView

	return baseRating, nil
}

// UpdateFameRating recalculates and updates a user's fame rating
func UpdateFameRating(userID int64) error {
	newRating, err := CalculateFameRating(userID)
	if err != nil {
		return err
	}

	_, err = database.DB.Exec(`
		UPDATE users SET fame_rating = ? WHERE id = ?
	`, newRating, userID)
	if err != nil {
		log.Printf("Error updating fame rating: %v", err)
		return err
	}

	return nil
}

// GetFameLevel returns the level (integer) from fame rating
func GetFameLevel(fameRating float64) int {
	return int(math.Floor(fameRating))
}

// IsMaxLevel checks if user has reached max level (100)
func IsMaxLevel(fameRating float64) bool {
	return GetFameLevel(fameRating) >= 100
}
