package handlers

import (
	"log"
	"sync"
	"time"

	"matcha/internal/database"
)

var (
	lastSeenUpdateTimes = make(map[int64]time.Time)
	lastSeenMutex        sync.RWMutex
	lastSeenUpdateInterval = 45 * time.Second // Update last_seen every 45 seconds
)

// updateLastSeenSporadically updates last_seen for a user, but only if enough time has passed
// since the last update to avoid overloading the database
func updateLastSeenSporadically(userID int64) {
	if userID <= 0 {
		return
	}

	lastSeenMutex.RLock()
	lastUpdate, exists := lastSeenUpdateTimes[userID]
	lastSeenMutex.RUnlock()

	now := time.Now()
	shouldUpdate := !exists || now.Sub(lastUpdate) >= lastSeenUpdateInterval

	if shouldUpdate {
		// Update last_seen in database
		_, err := database.DB.Exec("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?", userID)
		if err != nil {
			log.Printf("Error updating last_seen for user %d: %v", userID, err)
			return
		}

		// Update the tracking map
		lastSeenMutex.Lock()
		lastSeenUpdateTimes[userID] = now
		lastSeenMutex.Unlock()
	}
}

// ensureUserIsOnline ensures a user is marked as online (doesn't update last_seen)
func ensureUserIsOnline(userID int64) {
	if userID <= 0 {
		return
	}

	_, err := database.DB.Exec("UPDATE users SET is_online = 1 WHERE id = ?", userID)
	if err != nil {
		log.Printf("Error setting user %d online: %v", userID, err)
	}
}
