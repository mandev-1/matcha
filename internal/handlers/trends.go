package handlers

import (
	"log"
	"net/http"
	"strings"

	"matcha/internal/database"
)

// TrendsAPI handles GET /api/trends — returns popular tags, MBTI distribution, gender and orientation counts.
func TrendsAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		SendError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Popular tags (top 20)
	tagRows, err := database.DB.Query(`
		SELECT tag, COUNT(DISTINCT user_id) as user_count
		FROM user_tags
		WHERE tag IS NOT NULL AND TRIM(tag) != ''
		GROUP BY LOWER(TRIM(tag))
		ORDER BY user_count DESC
		LIMIT 20
	`)
	if err != nil {
		log.Printf("Error querying popular tags for trends: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load trends")
		return
	}
	defer tagRows.Close()

	popularTags := []map[string]interface{}{}
	for tagRows.Next() {
		var tag string
		var userCount int64
		if err := tagRows.Scan(&tag, &userCount); err != nil {
			continue
		}
		popularTags = append(popularTags, map[string]interface{}{
			"tag":         strings.TrimSpace(tag),
			"user_count": userCount,
		})
	}

	// Personality type (MBTI) counts
	mbtiRows, err := database.DB.Query(`
		SELECT mbti, COUNT(*) as cnt
		FROM users
		WHERE mbti IS NOT NULL AND TRIM(mbti) != ''
		GROUP BY UPPER(TRIM(mbti))
		ORDER BY cnt DESC
	`)
	if err != nil {
		log.Printf("Error querying MBTI for trends: %v", err)
	}
	if mbtiRows != nil {
		defer mbtiRows.Close()
	}

	personalityCounts := []map[string]interface{}{}
	if mbtiRows != nil {
		for mbtiRows.Next() {
			var mbti string
			var cnt int64
			if err := mbtiRows.Scan(&mbti, &cnt); err != nil {
				continue
			}
			personalityCounts = append(personalityCounts, map[string]interface{}{
				"type":  strings.TrimSpace(mbti),
				"count": cnt,
			})
		}
	}

	// Gender counts (male, female, etc.)
	genderRows, err := database.DB.Query(`
		SELECT gender, COUNT(*) as cnt
		FROM users
		WHERE gender IS NOT NULL AND TRIM(gender) != ''
		GROUP BY LOWER(TRIM(gender))
		ORDER BY cnt DESC
	`)
	if err != nil {
		log.Printf("Error querying gender for trends: %v", err)
	}
	if genderRows != nil {
		defer genderRows.Close()
	}

	genderCounts := []map[string]interface{}{}
	if genderRows != nil {
		for genderRows.Next() {
			var gender string
			var cnt int64
			if err := genderRows.Scan(&gender, &cnt); err != nil {
				continue
			}
			genderCounts = append(genderCounts, map[string]interface{}{
				"gender": strings.TrimSpace(gender),
				"count":  cnt,
			})
		}
	}

	// Sexual preference / orientation (straight, gay, both)
	prefRows, err := database.DB.Query(`
		SELECT sexual_preference, COUNT(*) as cnt
		FROM users
		WHERE sexual_preference IS NOT NULL AND TRIM(sexual_preference) != ''
		GROUP BY LOWER(TRIM(sexual_preference))
		ORDER BY cnt DESC
	`)
	if err != nil {
		log.Printf("Error querying sexual_preference for trends: %v", err)
	}
	if prefRows != nil {
		defer prefRows.Close()
	}

	orientationCounts := []map[string]interface{}{}
	if prefRows != nil {
		for prefRows.Next() {
			var pref string
			var cnt int64
			if err := prefRows.Scan(&pref, &cnt); err != nil {
				continue
			}
			orientationCounts = append(orientationCounts, map[string]interface{}{
				"orientation": strings.TrimSpace(pref),
				"count":       cnt,
			})
		}
	}

	SendSuccess(w, map[string]interface{}{
		"popular_tags":       popularTags,
		"personality_types":   personalityCounts,
		"gender_counts":       genderCounts,
		"orientation_counts": orientationCounts,
	})
}
