package handlers

import (
	"log"
	"net/http"
	"strconv"

	"matcha/internal/database"
)

// RankingAPI handles GET /api/ranking
func RankingAPI(w http.ResponseWriter, r *http.Request) {
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
		SELECT COUNT(*) FROM users WHERE is_setup = 1
	`).Scan(&total)
	if err != nil {
		log.Printf("Error counting users: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load ranking")
		return
	}

	// Get users ranked by fame_rating
	rows, err := database.DB.Query(`
		SELECT 
			id,
			username,
			first_name,
			last_name,
			fame_rating,
			is_bot
		FROM users
		WHERE is_setup = 1
		ORDER BY fame_rating DESC, id ASC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		log.Printf("Error querying ranking: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load ranking")
		return
	}
	defer rows.Close()

	users := []map[string]interface{}{}
	rank := offset + 1
	for rows.Next() {
		var id int64
		var username, firstName, lastName string
		var fameRating float64
		var isBot int

		err := rows.Scan(&id, &username, &firstName, &lastName, &fameRating, &isBot)
		if err != nil {
			log.Printf("Error scanning user row: %v", err)
			continue
		}

		// Calculate level from fame rating
		level := int(fameRating)

		user := map[string]interface{}{
			"rank":        rank,
			"id":          id,
			"username":    username,
			"first_name":  firstName,
			"last_name":   lastName,
			"fame_rating": fameRating,
			"level":       level,
			"is_bot":      isBot == 1,
		}
		users = append(users, user)
		rank++
	}

	SendSuccess(w, map[string]interface{}{
		"users": users,
		"total": total,
		"page":  page,
		"limit": limit,
		"pages": (total + limit - 1) / limit,
	})
}
