package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"matcha/internal/database"
)

// getDisplayName returns first_name + " " + last_name for the user, or username if names empty.
func getDisplayName(userID int64) string {
	var first, last, username string
	err := database.DB.QueryRow(
		`SELECT COALESCE(first_name,''), COALESCE(last_name,''), COALESCE(username,'') FROM users WHERE id = ?`,
		userID,
	).Scan(&first, &last, &username)
	if err != nil {
		return "Someone"
	}
	name := strings.TrimSpace(first + " " + last)
	if name == "" {
		return username
	}
	return name
}

// insertNotification creates a notification for the recipient (async, non-blocking).
// toUserID: who receives the notification; relatedUserID: e.g. who liked them / sent message (for navigation).
func insertNotification(toUserID int64, notifType, message string, relatedUserID int64) {
	go func() {
		insertNotificationSync(toUserID, notifType, message, relatedUserID)
	}()
}

// insertNotificationSync creates a notification synchronously so it is committed before the API returns.
// Use for like and message so the recipient is guaranteed to have a notification when the action succeeds.
func insertNotificationSync(toUserID int64, notifType, message string, relatedUserID int64) {
	res := database.GetWriteQueue().Enqueue(`
		INSERT INTO notifications (user_id, type, message, is_read, related_user_id)
		VALUES (?, ?, ?, 0, ?)
	`, toUserID, notifType, message, relatedUserID)
	if res.Error != nil {
		log.Printf("Error inserting notification: %v", res.Error)
	}
}

// NotificationsAPI handles GET /api/notifications
func NotificationsAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Get limit parameter (default 50)
	limit := 50
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Get notifications from database (related_user_id for navigation)
	rows, err := database.DB.Query(`
		SELECT 
			id,
			type,
			message,
			is_read,
			created_at,
			COALESCE(related_user_id, 0)
		FROM notifications
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ?
	`, userID, limit)

	if err != nil {
		log.Printf("Error querying notifications: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load notifications")
		return
	}
	defer rows.Close()

	notifications := []map[string]interface{}{}
	unreadCount := 0

	for rows.Next() {
		var notification struct {
			ID             int64
			Type           string
			Message        string
			IsRead         int
			CreatedAt      string
			RelatedUserID  int64
		}

		err := rows.Scan(
			&notification.ID,
			&notification.Type,
			&notification.Message,
			&notification.IsRead,
			&notification.CreatedAt,
			&notification.RelatedUserID,
		)
		if err != nil {
			log.Printf("Error scanning notification: %v", err)
			continue
		}

		isRead := notification.IsRead == 1
		if !isRead {
			unreadCount++
		}

		out := map[string]interface{}{
			"id":         notification.ID,
			"type":       notification.Type,
			"message":    notification.Message,
			"is_read":    isRead,
			"created_at": notification.CreatedAt,
		}
		if notification.RelatedUserID > 0 {
			out["related_user_id"] = notification.RelatedUserID
		}
		notifications = append(notifications, out)
	}

	SendSuccess(w, map[string]interface{}{
		"notifications": notifications,
		"unread_count": unreadCount,
	})
}

// MarkNotificationReadAPI handles POST /api/notifications/:id/read
func MarkNotificationReadAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user from token
	userID, err := getUserIDFromRequest(r)
	if err != nil {
		SendError(w, http.StatusUnauthorized, "Invalid or missing authentication token")
		return
	}

	// Extract notification ID from URL path directly
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")
	
	// Expected format: api/notifications/123/read
	var notificationIDStr string
	if len(parts) >= 4 && parts[0] == "api" && parts[1] == "notifications" && parts[3] == "read" {
		notificationIDStr = parts[2]
		// Remove query parameters if any
		if idx := strings.Index(notificationIDStr, "?"); idx != -1 {
			notificationIDStr = notificationIDStr[:idx]
		}
	}
	
	if notificationIDStr == "" {
		log.Printf("MarkNotificationReadAPI: Could not extract notification ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing notification ID parameter")
		return
	}
	
	notificationID, err := strconv.ParseInt(notificationIDStr, 10, 64)
	if err != nil || notificationID <= 0 {
		log.Printf("MarkNotificationReadAPI: Invalid notification ID '%s': %v", notificationIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid notification ID")
		return
	}

	// Verify notification belongs to user and mark as read
	result, err := database.DB.Exec(`
		UPDATE notifications
		SET is_read = 1
		WHERE id = ? AND user_id = ?
	`, notificationID, userID)

	if err != nil {
		log.Printf("Error updating notification: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to mark notification as read")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
	}

	if rowsAffected == 0 {
		SendError(w, http.StatusNotFound, "Notification not found")
		return
	}

	SendSuccess(w, map[string]interface{}{
		"message": "Notification marked as read",
	})
}


