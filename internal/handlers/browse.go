package handlers

import (
	"database/sql"
	"log"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"matcha/internal/database"
	"matcha/internal/services"
)

// normalizeEmptyString returns "-" if the string is empty, otherwise returns the string
func normalizeEmptyString(s string) string {
	if s == "" {
		return "-"
	}
	return s
}

// haversineDistance calculates the distance between two points on Earth in kilometers
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371.0

	// Convert to radians
	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	// Haversine formula
	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

// getDistanceZone returns the zone number (1=Close, 2=Not Close, 3=Antarctica)
func getDistanceZone(distanceKm float64) int {
	if distanceKm < 100 {
		return 1 // Close
	} else if distanceKm < 1500 {
		return 2 // Not Close
	}
	return 3 // Antarctica
}

// calculateTagSimilarity returns the number of matching tags and total common tags
func calculateTagSimilarity(tags1, tags2 []string) (matchingTags int, hasCommonTags bool) {
	tagMap := make(map[string]bool)
	for _, tag := range tags1 {
		tagMap[strings.ToLower(tag)] = true
	}

	matchingTags = 0
	for _, tag := range tags2 {
		if tagMap[strings.ToLower(tag)] {
			matchingTags++
		}
	}

	hasCommonTags = matchingTags > 0
	return matchingTags, hasCommonTags
}

// isMBTIHarmonic checks if two MBTI types are harmonic (compatible)
// Based on MBTI compatibility theory: types that share cognitive functions or are complementary
func isMBTIHarmonic(mbti1, mbti2 string) bool {
	if mbti1 == "" || mbti2 == "" {
		return false
	}

	// Convert to uppercase for comparison
	mbti1 = strings.ToUpper(mbti1)
	mbti2 = strings.ToUpper(mbti2)

	if len(mbti1) != 4 || len(mbti2) != 4 {
		return false
	}

	// Harmonic pairs: types that share the same middle two letters (S/N and T/F)
	// or are complementary (opposite on E/I and J/P but same on S/N and T/F)
	middle1 := mbti1[1:3] // S/N and T/F
	middle2 := mbti2[1:3]

	// Same cognitive functions (middle two letters match)
	if middle1 == middle2 {
		return true
	}

	// Complementary types: opposite E/I and J/P, but same S/N and T/F
	if (mbti1[0] != mbti2[0]) && (mbti1[3] != mbti2[3]) && (middle1 == middle2) {
		return true
	}

	return false
}

// profileWithScore holds a profile with its sorting scores
type profileWithScore struct {
	profile        map[string]interface{}
	distanceZone   int
	distanceKm     float64
	tagMatches     int
	hasCommonTags  bool
	isMBTIHarmonic bool
}

// BrowseAPI handles GET /api/browse
func BrowseAPI(w http.ResponseWriter, r *http.Request) {
	// Get current user ID (optional - for filtering)
	currentUserID, _ := getUserIDFromRequest(r)

	// Update online status and last_seen sporadically if user is authenticated
	if currentUserID > 0 {
		ensureUserIsOnline(currentUserID)
		updateLastSeenSporadically(currentUserID)
	}

	// Get query parameters
	sortParam := r.URL.Query().Get("sort")
	minAge := r.URL.Query().Get("minAge")
	maxAge := r.URL.Query().Get("maxAge")
	minDistanceStr := r.URL.Query().Get("minDistance")
	maxDistanceStr := r.URL.Query().Get("maxDistance")
	onlyCommonTagsStr := r.URL.Query().Get("onlyCommonTags")
	fameRatingMinStr := r.URL.Query().Get("fameRatingMin")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50
	offset := 0
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Get current user's location, MBTI, gender, and sexual_preference for filtering and sorting
	var currentUserLat, currentUserLon sql.NullFloat64
	var currentUserMBTI sql.NullString
	var currentUserGender, currentUserSexualPreference sql.NullString
	var currentUserTags []string

	if currentUserID > 0 {
		err := database.DB.QueryRow(`
			SELECT latitude, longitude, mbti, gender, sexual_preference
			FROM users
			WHERE id = ?
		`, currentUserID).Scan(&currentUserLat, &currentUserLon, &currentUserMBTI, &currentUserGender, &currentUserSexualPreference)
		if err == nil {
			// Get current user's tags
			tagRows, err := database.DB.Query("SELECT tag FROM user_tags WHERE user_id = ?", currentUserID)
			if err == nil {
				defer tagRows.Close()
				for tagRows.Next() {
					var tag string
					if err := tagRows.Scan(&tag); err == nil {
						currentUserTags = append(currentUserTags, tag)
					}
				}
			}
		}
	}

	// Build query - get all users first, then sort in memory
	query := `
		SELECT 
			u.id, u.username, u.first_name, u.last_name, u.gender, u.biography,
			u.birth_date, u.location, u.fame_rating, u.is_online, u.last_seen,
			u.latitude, u.longitude, u.mbti, u.sexual_preference,
			(SELECT file_path FROM user_pictures WHERE user_id = u.id AND is_profile = 1 AND order_index = 0 LIMIT 1) as profile_picture
		FROM users u
		WHERE u.is_setup = 1 AND u.is_email_verified = 1
	`
	args := []interface{}{}

	// Exclude current user if logged in
	if currentUserID > 0 {
		query += " AND u.id != ?"
		args = append(args, currentUserID)

		// Exclude users who have a mutual like (connection) with current user
		// A mutual like means: current user liked them AND they liked current user back
		query += ` AND NOT EXISTS (
			SELECT 1 FROM likes l1
			WHERE l1.from_user_id = ? AND l1.to_user_id = u.id
			AND EXISTS (
				SELECT 1 FROM likes l2
				WHERE l2.from_user_id = u.id AND l2.to_user_id = ?
			)
		)`
		args = append(args, currentUserID, currentUserID)
	}

	// Orientation filtering
	// If user has not specified orientation, treat as bisexual (show all)
	// Logic:
	// - If current user wants "male": show profiles with gender="male" AND (they want "female" OR "both" OR NULL)
	// - If current user wants "female": show profiles with gender="female" AND (they want "male" OR "both" OR NULL)
	// - If current user wants "both" or NULL: show all profiles where they want current user's gender OR "both" OR NULL
	if currentUserID > 0 && currentUserGender.Valid {
		currentUserPref := strings.ToLower(strings.TrimSpace(currentUserSexualPreference.String))
		currentUserGen := strings.ToLower(strings.TrimSpace(currentUserGender.String))

		// Default to "both" (bisexual) if preference is empty
		if currentUserPref == "" {
			currentUserPref = "both"
		}

		if currentUserPref == "male" {
			// Current user wants males - show male profiles that want current user's gender or both
			query += " AND u.gender = 'male' AND (u.sexual_preference = ? OR u.sexual_preference = 'both' OR u.sexual_preference IS NULL OR u.sexual_preference = '')"
			args = append(args, currentUserGen)
		} else if currentUserPref == "female" {
			// Current user wants females - show female profiles that want current user's gender or both
			query += " AND u.gender = 'female' AND (u.sexual_preference = ? OR u.sexual_preference = 'both' OR u.sexual_preference IS NULL OR u.sexual_preference = '')"
			args = append(args, currentUserGen)
		} else {
			// Current user is bisexual (both or empty) - show profiles that want current user's gender or both or empty
			query += " AND (u.sexual_preference = ? OR u.sexual_preference = 'both' OR u.sexual_preference IS NULL OR u.sexual_preference = '')"
			args = append(args, currentUserGen)
		}
	}

	// Age filtering
	if minAge != "" {
		if minAgeInt, err := strconv.Atoi(minAge); err == nil {
			maxBirthYear := time.Now().Year() - minAgeInt
			query += " AND (u.birth_date IS NULL OR CAST(strftime('%Y', u.birth_date) AS INTEGER) <= ?)"
			args = append(args, maxBirthYear)
		}
	}
	if maxAge != "" {
		if maxAgeInt, err := strconv.Atoi(maxAge); err == nil {
			minBirthYear := time.Now().Year() - maxAgeInt
			query += " AND (u.birth_date IS NULL OR CAST(strftime('%Y', u.birth_date) AS INTEGER) >= ?)"
			args = append(args, minBirthYear)
		}
	}

	// Fame rating minimum filter (SQL-based)
	if fameRatingMinStr != "" {
		if fameRatingMin, err := strconv.ParseFloat(fameRatingMinStr, 64); err == nil && fameRatingMin > 0 {
			query += " AND u.fame_rating >= ?"
			args = append(args, fameRatingMin)
		}
	}

	// For SQL-based sorting (fame), use SQL ORDER BY
	// For age, location and tags, we'll sort in memory to handle nulls properly
	if sortParam == "fame" {
		query += " ORDER BY u.fame_rating DESC"
	}
	// age, location and tags sorting will be done in memory

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Printf("Error querying users: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load profiles")
		return
	}
	defer rows.Close()

	profilesWithScores := []profileWithScore{}

	for rows.Next() {
		var user struct {
			ID               int64
			Username         string
			FirstName        string
			LastName         string
			Gender           sql.NullString
			Biography        sql.NullString
			BirthDate        sql.NullString
			Location         sql.NullString
			FameRating       float64
			IsOnline         bool
			LastSeen         sql.NullString
			Latitude         sql.NullFloat64
			Longitude        sql.NullFloat64
			MBTI             sql.NullString
			SexualPreference sql.NullString
			ProfilePicture   sql.NullString
		}

		err := rows.Scan(
			&user.ID, &user.Username, &user.FirstName, &user.LastName,
			&user.Gender, &user.Biography, &user.BirthDate, &user.Location,
			&user.FameRating, &user.IsOnline, &user.LastSeen,
			&user.Latitude, &user.Longitude, &user.MBTI, &user.SexualPreference, &user.ProfilePicture,
		)
		if err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}

		// Calculate age
		age := 0
		if user.BirthDate.Valid {
			if birthDate, err := time.Parse("2006-01-02", user.BirthDate.String); err == nil {
				age = time.Now().Year() - birthDate.Year()
				if time.Now().Before(time.Date(time.Now().Year(), birthDate.Month(), birthDate.Day(), 0, 0, 0, 0, time.UTC)) {
					age--
				}
			}
		}

		// Get tags
		tagRows, err := database.DB.Query("SELECT tag FROM user_tags WHERE user_id = ?", user.ID)
		tags := []string{}
		if err == nil {
			defer tagRows.Close()
			for tagRows.Next() {
				var tag string
				if err := tagRows.Scan(&tag); err == nil {
					tags = append(tags, tag)
				}
			}
		}

		// Calculate distance, tag similarity, and MBTI harmony
		distanceKm := 0.0
		distanceZone := 3 // Default to Antarctica
		tagMatches := 0
		hasCommonTags := false
		mbtiHarmonic := false

		if currentUserLat.Valid && currentUserLon.Valid && user.Latitude.Valid && user.Longitude.Valid {
			distanceKm = haversineDistance(
				currentUserLat.Float64, currentUserLon.Float64,
				user.Latitude.Float64, user.Longitude.Float64,
			)
			distanceZone = getDistanceZone(distanceKm)
		}

		if len(currentUserTags) > 0 && len(tags) > 0 {
			tagMatches, hasCommonTags = calculateTagSimilarity(currentUserTags, tags)
		}

		if currentUserMBTI.Valid && user.MBTI.Valid {
			mbtiHarmonic = isMBTIHarmonic(currentUserMBTI.String, user.MBTI.String)
		}

		profile := map[string]interface{}{
			"id":          user.ID,
			"username":    normalizeEmptyString(user.Username),
			"first_name":  normalizeEmptyString(user.FirstName),
			"last_name":   normalizeEmptyString(user.LastName),
			"age":         age,
			"fame_rating": user.FameRating,
			"is_online":   user.IsOnline,
			"tags":        tags,
			"distance_km": distanceKm,
		}

		// Handle nullable fields
		if user.Location.Valid {
			profile["location"] = normalizeEmptyString(user.Location.String)
		} else {
			profile["location"] = "-"
		}

		if user.LastSeen.Valid {
			profile["last_seen"] = normalizeEmptyString(user.LastSeen.String)
		} else {
			profile["last_seen"] = "-"
		}

		if user.ProfilePicture.Valid {
			profile["profile_picture"] = normalizeEmptyString(user.ProfilePicture.String)
		} else {
			profile["profile_picture"] = ""
		}

		if user.Gender.Valid {
			profile["gender"] = normalizeEmptyString(user.Gender.String)
		} else {
			profile["gender"] = "-"
		}
		if user.Biography.Valid {
			profile["biography"] = normalizeEmptyString(user.Biography.String)
		} else {
			profile["biography"] = "-"
		}

		profilesWithScores = append(profilesWithScores, profileWithScore{
			profile:        profile,
			distanceZone:   distanceZone,
			distanceKm:     distanceKm,
			tagMatches:     tagMatches,
			hasCommonTags:  hasCommonTags,
			isMBTIHarmonic: mbtiHarmonic,
		})
	}

	// Apply filters
	filteredProfiles := []profileWithScore{}
	for _, p := range profilesWithScores {
		// Distance filter
		if minDistanceStr != "" || maxDistanceStr != "" {
			minDistance := 0.0
			maxDistance := 5000.0
			if minDistanceStr != "" {
				if d, err := strconv.ParseFloat(minDistanceStr, 64); err == nil {
					minDistance = d
				}
			}
			if maxDistanceStr != "" {
				if d, err := strconv.ParseFloat(maxDistanceStr, 64); err == nil {
					maxDistance = d
				}
			}
			// Only filter if distance was calculated (distanceZone < 3)
			if p.distanceZone < 3 {
				if p.distanceKm < minDistance || p.distanceKm > maxDistance {
					continue
				}
			} else {
				// If no distance calculated, exclude if minDistance > 0
				if minDistance > 0 {
					continue
				}
			}
		}

		// Only common tags filter
		if onlyCommonTagsStr == "true" {
			if !p.hasCommonTags {
				continue
			}
		}

		filteredProfiles = append(filteredProfiles, p)
	}
	profilesWithScores = filteredProfiles

	// Apply sorting based on sortParam
	if sortParam == "age_asc" {
		// Sort by age - youngest first, users with no age last
		sort.Slice(profilesWithScores, func(i, j int) bool {
			pi, pj := profilesWithScores[i], profilesWithScores[j]
			piAge := pi.profile["age"].(int)
			pjAge := pj.profile["age"].(int)

			// Users with no age (age == 0) go last
			if piAge == 0 && pjAge > 0 {
				return false
			}
			if pjAge == 0 && piAge > 0 {
				return true
			}

			// Sort by age (youngest first)
			return piAge > pjAge
		})
	} else if sortParam == "age_desc" {
		// Sort by age - oldest first, users with no age last
		sort.Slice(profilesWithScores, func(i, j int) bool {
			pi, pj := profilesWithScores[i], profilesWithScores[j]
			piAge := pi.profile["age"].(int)
			pjAge := pj.profile["age"].(int)

			// Users with no age (age == 0) go last
			if piAge == 0 && pjAge > 0 {
				return false
			}
			if pjAge == 0 && piAge > 0 {
				return true
			}

			// Sort by age (oldest first)
			return piAge < pjAge
		})
	} else if sortParam == "location" {
		// Sort by location (distance) - closest first
		// Only sort by location if current user has location
		if currentUserID > 0 && currentUserLat.Valid && currentUserLon.Valid {
			sort.Slice(profilesWithScores, func(i, j int) bool {
				pi, pj := profilesWithScores[i], profilesWithScores[j]
				// Check if distance was actually calculated
				// distanceZone == 3 (Antarctica) is the default when no distance is calculated
				// If distanceZone is 1 or 2, distance was calculated
				piHasDistance := pi.distanceZone < 3
				pjHasDistance := pj.distanceZone < 3

				// Users without distance (no location) go last
				if !piHasDistance && pjHasDistance {
					return false
				}
				if !pjHasDistance && piHasDistance {
					return true
				}

				// If neither has distance, maintain order
				if !piHasDistance && !pjHasDistance {
					return false
				}

				// Sort by distance zone first (1=Close, 2=Not Close), then distance
				if pi.distanceZone != pj.distanceZone {
					return pi.distanceZone < pj.distanceZone
				}
				// Within same zone, sort by distance (closest first)
				return pi.distanceKm < pj.distanceKm
			})
		}
		// If current user doesn't have location, don't sort (maintain original order)
	} else if sortParam == "tags" {
		// Sort by common tags - most matches first, users with no tags last
		sort.Slice(profilesWithScores, func(i, j int) bool {
			pi, pj := profilesWithScores[i], profilesWithScores[j]
			piTags := pi.profile["tags"].([]string)
			pjTags := pj.profile["tags"].([]string)

			// Users with no tags go last
			if len(piTags) == 0 && len(pjTags) > 0 {
				return false
			}
			if len(pjTags) == 0 && len(piTags) > 0 {
				return true
			}

			// Sort by tag matches
			if pi.tagMatches != pj.tagMatches {
				return pi.tagMatches > pj.tagMatches
			}
			// If same tag matches, sort by fame rating
			return pi.profile["fame_rating"].(float64) > pj.profile["fame_rating"].(float64)
		})
	} else if sortParam == "" {
		// Default sorting: distance zone, then tag similarity, then MBTI harmony, then fame
		// Only apply if user is logged in and has location
		if currentUserID > 0 && currentUserLat.Valid && currentUserLon.Valid {
			sort.Slice(profilesWithScores, func(i, j int) bool {
				pi, pj := profilesWithScores[i], profilesWithScores[j]

				// 1. Sort by distance zone (1=Close, 2=Not Close, 3=Antarctica)
				if pi.distanceZone != pj.distanceZone {
					return pi.distanceZone < pj.distanceZone
				}

				// Within same zone, sort by distance
				if pi.distanceZone == pj.distanceZone {
					if math.Abs(pi.distanceKm-pj.distanceKm) > 0.1 {
						return pi.distanceKm < pj.distanceKm
					}
				}

				// 2. Sort by tag similarity (multiple same tags > same tag > no common tags)
				if pi.tagMatches != pj.tagMatches {
					return pi.tagMatches > pj.tagMatches
				}

				// 3. Sort by MBTI harmony
				if pi.isMBTIHarmonic != pj.isMBTIHarmonic {
					return pi.isMBTIHarmonic && !pj.isMBTIHarmonic
				}

				// 4. Remainder: sort by fame rating
				return pi.profile["fame_rating"].(float64) > pj.profile["fame_rating"].(float64)
			})
		}
	}
	// For "fame", "age_asc", "age_desc" - already sorted by SQL

	// Extract profiles and apply pagination
	profiles := []map[string]interface{}{}
	start := offset
	end := offset + limit
	if start > len(profilesWithScores) {
		start = len(profilesWithScores)
	}
	if end > len(profilesWithScores) {
		end = len(profilesWithScores)
	}

	for i := start; i < end; i++ {
		profiles = append(profiles, profilesWithScores[i].profile)
	}

	SendSuccess(w, map[string]interface{}{
		"profiles": profiles,
		"sort":     sortParam,
		"minAge":   minAge,
		"maxAge":   maxAge,
		"limit":    limit,
		"offset":   offset,
	})
}

// SearchAPI handles GET /api/search
func SearchAPI(w http.ResponseWriter, r *http.Request) {
	// TODO: Get search criteria from query params
	// TODO: Return matching profiles

	SendSuccess(w, map[string]interface{}{
		"profiles": []interface{}{},
	})
}

// UserProfileAPI handles GET /api/user/:id
func UserProfileAPI(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL path directly (more reliable than pat.Param)
	urlPath := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(urlPath, "/")

	// Expected format: api/user/123
	var userIDStr string
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "user" {
		userIDStr = parts[2]
		// Remove query parameters if any
		if idx := strings.Index(userIDStr, "?"); idx != -1 {
			userIDStr = userIDStr[:idx]
		}
	}

	if userIDStr == "" {
		log.Printf("UserProfileAPI: Could not extract user ID from URL: %s", r.URL.Path)
		SendError(w, http.StatusBadRequest, "Missing user ID parameter")
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil || userID <= 0 {
		log.Printf("UserProfileAPI: Invalid user ID '%s': %v", userIDStr, err)
		SendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get current user ID (optional)
	currentUserID, _ := getUserIDFromRequest(r)

	// Load user profile from database
	var user struct {
		ID                int64
		Username          string
		FirstName         string
		LastName          string
		Gender            sql.NullString
		SexualPreference  sql.NullString
		Biography         sql.NullString
		BirthDate         sql.NullString
		Location          sql.NullString
		Latitude          sql.NullFloat64
		Longitude         sql.NullFloat64
		FameRating        float64
		IsOnline          bool
		LastSeen          sql.NullString
		IsSetup           bool
		Openness          sql.NullString
		Conscientiousness sql.NullString
		Extraversion      sql.NullString
		Agreeableness     sql.NullString
		Neuroticism       sql.NullString
		Siblings          sql.NullString
		MBTI              sql.NullString
		CaliperProfile    sql.NullString
	}

	err = database.DB.QueryRow(`
		SELECT 
			id, username, first_name, last_name, gender, sexual_preference,
			biography, birth_date, location, latitude, longitude,
			fame_rating, is_online, last_seen, is_setup,
			openness, conscientiousness, extraversion, agreeableness, neuroticism,
			siblings, mbti, caliper_profile
		FROM users 
		WHERE id = ? AND is_setup = 1
	`, userID).Scan(
		&user.ID, &user.Username, &user.FirstName, &user.LastName,
		&user.Gender, &user.SexualPreference, &user.Biography, &user.BirthDate,
		&user.Location, &user.Latitude, &user.Longitude,
		&user.FameRating, &user.IsOnline, &user.LastSeen, &user.IsSetup,
		&user.Openness, &user.Conscientiousness, &user.Extraversion,
		&user.Agreeableness, &user.Neuroticism, &user.Siblings, &user.MBTI, &user.CaliperProfile,
	)

	if err == sql.ErrNoRows {
		SendError(w, http.StatusNotFound, "User not found")
		return
	}
	if err != nil {
		log.Printf("Error loading user profile: %v", err)
		SendError(w, http.StatusInternalServerError, "Failed to load profile")
		return
	}

	// Calculate age
	age := 0
	if user.BirthDate.Valid {
		if birthDate, err := time.Parse("2006-01-02", user.BirthDate.String); err == nil {
			age = time.Now().Year() - birthDate.Year()
			if time.Now().Before(time.Date(time.Now().Year(), birthDate.Month(), birthDate.Day(), 0, 0, 0, 0, time.UTC)) {
				age--
			}
		}
	}

	// Get profile picture
	var profilePicture sql.NullString
	err = database.DB.QueryRow(`
		SELECT file_path FROM user_pictures 
		WHERE user_id = ? AND is_profile = 1 AND order_index = 0 LIMIT 1
	`, userID).Scan(&profilePicture)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error getting profile picture: %v", err)
	}

	// Get all pictures
	images := []string{} // Initialize as empty slice, never nil
	imageRows, err := database.DB.Query(`
		SELECT file_path FROM user_pictures 
		WHERE user_id = ? 
		ORDER BY order_index ASC
	`, userID)
	if err == nil {
		defer imageRows.Close()
		for imageRows.Next() {
			var imgPath sql.NullString
			if err := imageRows.Scan(&imgPath); err == nil && imgPath.Valid {
				images = append(images, imgPath.String)
			}
		}
	} else {
		log.Printf("Error querying images: %v", err)
	}

	// Get tags
	tags := []string{} // Initialize as empty slice, never nil
	tagRows, err := database.DB.Query("SELECT tag FROM user_tags WHERE user_id = ?", userID)
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var tag string
			if err := tagRows.Scan(&tag); err == nil {
				tags = append(tags, tag)
			}
		}
	} else {
		log.Printf("Error querying tags: %v", err)
	}

	// Check if liked and if it's a mutual like (connection)
	isLiked := false
	isConnected := false
	hasViewedYourProfile := false
	isBlocked := false
	blockedAt := ""
	if currentUserID > 0 {
		var likeID int64
		err = database.DB.QueryRow(`
			SELECT id FROM likes 
			WHERE from_user_id = ? AND to_user_id = ?
		`, currentUserID, userID).Scan(&likeID)
		isLiked = (err == nil)

		// Check if it's a mutual like (connection)
		if isLiked {
			var mutualLikeID int64
			err = database.DB.QueryRow(`
				SELECT id FROM likes 
				WHERE from_user_id = ? AND to_user_id = ?
			`, userID, currentUserID).Scan(&mutualLikeID)
			isConnected = (err == nil)
		}

		// Check if this user has viewed your profile
		var viewID int64
		err = database.DB.QueryRow(`
			SELECT id FROM views 
			WHERE viewer_id = ? AND viewed_id = ?
		`, userID, currentUserID).Scan(&viewID)
		hasViewedYourProfile = (err == nil)

		// Check if current user has blocked this profile
		var blockCreatedAt sql.NullString
		err = database.DB.QueryRow(`
			SELECT created_at FROM blocks 
			WHERE blocker_id = ? AND blocked_id = ?
		`, currentUserID, userID).Scan(&blockCreatedAt)
		if err == nil {
			isBlocked = true
			if blockCreatedAt.Valid {
				blockedAt = blockCreatedAt.String
			}
		}
	}

	// Record view (if current user is viewing)
	if currentUserID > 0 && currentUserID != userID {
		// Use write queue for concurrent safety
		result := database.GetWriteQueue().Enqueue(`
			INSERT OR IGNORE INTO views (viewer_id, viewed_id, created_at)
			VALUES (?, ?, CURRENT_TIMESTAMP)
		`, currentUserID, userID)

		// Update fame rating for viewed user if view was actually inserted (new view)
		if result.Error == nil && result.RowsAffected > 0 {
			insertNotification(userID, "view", getDisplayName(currentUserID)+" viewed your profile", currentUserID)
			go func() {
				if err := services.UpdateFameRating(userID); err != nil {
					log.Printf("Error updating fame rating for user %d: %v", userID, err)
				}
			}()
		}

		// Check if current user is a bot and log activity
		var isBot int
		var botUsername string
		err = database.DB.QueryRow("SELECT is_bot, username FROM users WHERE id = ?", currentUserID).Scan(&isBot, &botUsername)
		if err == nil && isBot == 1 {
			// Log bot activity asynchronously
			go func() {
				database.GetWriteQueue().EnqueueAsync(`
					INSERT INTO bot_activity_log (bot_id, bot_username, action_type, target_user_id, target_username, details)
					VALUES (?, ?, 'view_profile', ?, ?, '')
				`, currentUserID, botUsername, userID, user.Username)
			}()
		}
	}

	// Build response - normalize empty strings to "-"
	response := map[string]interface{}{
		"id":                      user.ID,
		"username":                normalizeEmptyString(user.Username),
		"first_name":              normalizeEmptyString(user.FirstName),
		"last_name":               normalizeEmptyString(user.LastName),
		"age":                     age,
		"fame_rating":             user.FameRating,
		"is_online":               user.IsOnline,
		"images":                  images,
		"tags":                    tags,
		"is_liked":                isLiked,
		"is_connected":            isConnected,
		"has_viewed_your_profile": hasViewedYourProfile,
		"is_blocked":              isBlocked,
	}

	if blockedAt != "" {
		response["blocked_at"] = blockedAt
	}

	// Handle nullable string fields - replace empty strings with "-"
	if user.Location.Valid {
		response["location"] = normalizeEmptyString(user.Location.String)
	} else {
		response["location"] = "-"
	}

	if user.Biography.Valid {
		response["biography"] = normalizeEmptyString(user.Biography.String)
	} else {
		response["biography"] = "-"
	}

	if user.LastSeen.Valid {
		response["last_seen"] = normalizeEmptyString(user.LastSeen.String)
	} else {
		response["last_seen"] = "-"
	}

	if profilePicture.Valid {
		response["profile_picture"] = normalizeEmptyString(profilePicture.String)
	} else {
		response["profile_picture"] = "-"
	}

	if user.Gender.Valid {
		response["gender"] = normalizeEmptyString(user.Gender.String)
	} else {
		response["gender"] = "-"
	}
	if user.SexualPreference.Valid {
		response["sexual_preference"] = normalizeEmptyString(user.SexualPreference.String)
	} else {
		response["sexual_preference"] = "-"
	}
	if user.MBTI.Valid {
		response["mbti"] = normalizeEmptyString(user.MBTI.String)
	} else {
		response["mbti"] = "-"
	}
	if user.Latitude.Valid && user.Longitude.Valid {
		response["latitude"] = user.Latitude.Float64
		response["longitude"] = user.Longitude.Float64
	}

	// Big Five - replace empty strings with "-"
	bigFive := map[string]string{}
	if user.Openness.Valid {
		bigFive["openness"] = normalizeEmptyString(user.Openness.String)
	} else {
		bigFive["openness"] = "-"
	}
	if user.Conscientiousness.Valid {
		bigFive["conscientiousness"] = normalizeEmptyString(user.Conscientiousness.String)
	} else {
		bigFive["conscientiousness"] = "-"
	}
	if user.Extraversion.Valid {
		bigFive["extraversion"] = normalizeEmptyString(user.Extraversion.String)
	} else {
		bigFive["extraversion"] = "-"
	}
	if user.Agreeableness.Valid {
		bigFive["agreeableness"] = normalizeEmptyString(user.Agreeableness.String)
	} else {
		bigFive["agreeableness"] = "-"
	}
	if user.Neuroticism.Valid {
		bigFive["neuroticism"] = normalizeEmptyString(user.Neuroticism.String)
	} else {
		bigFive["neuroticism"] = "-"
	}
	response["big_five"] = bigFive

	if user.Siblings.Valid {
		response["siblings"] = normalizeEmptyString(user.Siblings.String)
	} else {
		response["siblings"] = "-"
	}
	if user.CaliperProfile.Valid {
		response["caliper_profile"] = normalizeEmptyString(user.CaliperProfile.String)
	} else {
		response["caliper_profile"] = "-"
	}

	// Final pass: ensure all string fields are never nil or empty - replace with "-"
	for key, value := range response {
		if str, ok := value.(string); ok {
			if str == "" {
				response[key] = "-"
			}
		}
	}

	// Ensure arrays are never nil
	if response["images"] == nil {
		response["images"] = []string{}
	}
	if response["tags"] == nil {
		response["tags"] = []string{}
	}

	SendSuccess(w, response)
}
