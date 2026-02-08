package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"matcha/internal/database"
)

// BotActivityLogAPI handles GET /api/bot-activity
func BotActivityLogAPI(w http.ResponseWriter, r *http.Request) {
	// Get pagination parameters
	page := 1
	limit := 50
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	// Get total count
	var total int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM bot_activity_log
	`).Scan(&total)
	if err != nil {
		log.Printf("Error counting bot activity: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load activity log")
		return
	}

	// Get activity logs with user names
	rows, err := database.DB.Query(`
		SELECT 
			bal.id,
			bal.bot_id,
			bal.bot_username,
			COALESCE(bot_user.first_name || ' ' || bot_user.last_name, bal.bot_username) as bot_display_name,
			bal.action_type,
			bal.target_user_id,
			bal.target_username,
			COALESCE(target_user.first_name || ' ' || target_user.last_name, bal.target_username) as target_display_name,
			bal.details,
			bal.created_at
		FROM bot_activity_log bal
		LEFT JOIN users bot_user ON bal.bot_id = bot_user.id
		LEFT JOIN users target_user ON bal.target_user_id = target_user.id
		ORDER BY bal.created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		log.Printf("Error querying bot activity: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load activity log")
		return
	}
	defer rows.Close()

	activities := []map[string]interface{}{}
	for rows.Next() {
		var activity struct {
			ID                int64
			BotID             int64
			BotUsername       string
			BotDisplayName    sql.NullString
			ActionType        string
			TargetUserID      sql.NullInt64
			TargetUsername    sql.NullString
			TargetDisplayName sql.NullString
			Details           sql.NullString
			CreatedAt         string
		}

		err := rows.Scan(
			&activity.ID,
			&activity.BotID,
			&activity.BotUsername,
			&activity.BotDisplayName,
			&activity.ActionType,
			&activity.TargetUserID,
			&activity.TargetUsername,
			&activity.TargetDisplayName,
			&activity.Details,
			&activity.CreatedAt,
		)
		if err != nil {
			continue
		}

		activityMap := map[string]interface{}{
			"id":            activity.ID,
			"bot_id":        activity.BotID,
			"bot_username":  activity.BotUsername,
			"action_type":   activity.ActionType,
			"created_at":    activity.CreatedAt,
		}

		// Use display name if available, otherwise fall back to username
		if activity.BotDisplayName.Valid && activity.BotDisplayName.String != "" {
			activityMap["bot_display_name"] = activity.BotDisplayName.String
		} else {
			activityMap["bot_display_name"] = activity.BotUsername
		}

		if activity.TargetUserID.Valid {
			activityMap["target_user_id"] = activity.TargetUserID.Int64
		}
		if activity.TargetUsername.Valid {
			activityMap["target_username"] = activity.TargetUsername.String
			// Use display name if available, otherwise fall back to username
			if activity.TargetDisplayName.Valid && activity.TargetDisplayName.String != "" {
				activityMap["target_display_name"] = activity.TargetDisplayName.String
			} else {
				activityMap["target_display_name"] = activity.TargetUsername.String
			}
		}
		if activity.Details.Valid {
			activityMap["details"] = activity.Details.String
		}

		activities = append(activities, activityMap)
	}

	SendSuccess(w, map[string]interface{}{
		"activities": activities,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"pages":      (total + limit - 1) / limit, // Ceiling division
	})
}
