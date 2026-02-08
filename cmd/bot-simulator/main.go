package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type BotConfig struct {
	ServerURL      string
	DBPath         string
	NumBots        int
	ActionInterval time.Duration
	Concurrency    int
}

// BotBehaviorPattern defines different types of bot behaviors
type BotBehaviorPattern int

const (
	PatternExplorer BotBehaviorPattern = iota // Likes to browse and view profiles
	PatternLiker                              // Likes many profiles
	PatternSocial                             // Focuses on messaging and connections
	PatternCasual                             // Balanced, casual activity
	PatternActive                             // Very active, does everything frequently
)

type Bot struct {
	ID       int64
	Username string
	Token    string
	Client   *http.Client
	Pattern  BotBehaviorPattern
	DB       *sql.DB
	// Track recently viewed profiles for view-before-like logic
	recentlyViewed map[int64]time.Time
	viewMutex      sync.RWMutex
}

type LoginResponse struct {
	Success bool   `json:"success"`
	Data    struct {
		Token string `json:"token"`
	} `json:"data"`
	Error string `json:"error"`
}

type Profile struct {
	ID          int64   `json:"id"`
	IsBot       bool    `json:"is_bot,omitempty"` // We'll check this from the database
	Username    string  `json:"username,omitempty"`
	FameRating  float64 `json:"fame_rating,omitempty"`
}

type BrowseResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Profiles []Profile `json:"profiles"`
	} `json:"data"`
	Error string `json:"error"`
}

type PopularTagsResponse struct {
	Success bool `json:"success"`
	Data    struct {
		PopularTags []struct {
			Tag string `json:"tag"`
		} `json:"popular_tags"`
	} `json:"data"`
}

func main() {
	rand.Seed(time.Now().UnixNano())

	config := BotConfig{}

	flag.StringVar(&config.ServerURL, "server", "http://localhost:8080", "Server URL")
	flag.StringVar(&config.DBPath, "db", "./data/matcha.db", "Database path")
	flag.IntVar(&config.NumBots, "bots", 10, "Number of bots to simulate")
	flag.DurationVar(&config.ActionInterval, "interval", 30*time.Second, "Interval between actions per bot")
	flag.IntVar(&config.Concurrency, "concurrency", 5, "Number of concurrent bot actions")
	flag.Parse()

	log.Printf("Starting bot simulator with %d bots, interval: %v, concurrency: %d",
		config.NumBots, config.ActionInterval, config.Concurrency)

	// Open database
	db, err := sql.Open("sqlite3", config.DBPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Ensure bot_activity_log table exists
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS bot_activity_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			bot_id INTEGER NOT NULL,
			bot_username TEXT NOT NULL,
			action_type TEXT NOT NULL,
			target_user_id INTEGER,
			target_username TEXT,
			details TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		log.Printf("Warning: Could not create bot_activity_log table: %v", err)
	}

	// Get bot users
	bots, err := loadBots(db, config)
	if err != nil {
		log.Fatalf("Failed to load bots: %v", err)
	}

	if len(bots) == 0 {
		log.Fatal("No bot users found. Run 'make 500' first to create bot accounts.")
	}

	log.Printf("Loaded %d bot users", len(bots))

	// Start bot simulation
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, config.Concurrency)

	for _, bot := range bots {
		wg.Add(1)
		go func(b Bot) {
			defer wg.Done()
			simulateBot(b, config, semaphore)
		}(bot)
	}

	// Wait for all bots
	wg.Wait()
}

func loadBots(db *sql.DB, config BotConfig) ([]Bot, error) {
	rows, err := db.Query(`
		SELECT id, username 
		FROM users 
		WHERE is_bot = 1 
		LIMIT ?
	`, config.NumBots)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bots []Bot
	patterns := []BotBehaviorPattern{PatternExplorer, PatternLiker, PatternSocial, PatternCasual, PatternActive}
	patternIdx := 0

	for rows.Next() {
		var bot Bot
		if err := rows.Scan(&bot.ID, &bot.Username); err != nil {
			continue
		}
		bot.Client = &http.Client{Timeout: 10 * time.Second}
		bot.Pattern = patterns[patternIdx%len(patterns)] // Distribute patterns
		bot.DB = db
		bot.recentlyViewed = make(map[int64]time.Time)
		bots = append(bots, bot)
		patternIdx++
	}

	return bots, nil
}

func authenticateBot(bot *Bot, config BotConfig) error {
	loginData := map[string]string{
		"username": bot.Username,
		"password": "test123", // Default password for generated bots
	}

	jsonData, err := json.Marshal(loginData)
	if err != nil {
		return err
	}

	resp, err := bot.Client.Post(
		fmt.Sprintf("%s/api/login", config.ServerURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return err
	}

	if !loginResp.Success {
		return fmt.Errorf("login failed: %s", loginResp.Error)
	}

	bot.Token = loginResp.Data.Token
	return nil
}

func logBotActivity(db *sql.DB, botID int64, botUsername, actionType string, targetUserID *int64, targetUsername, details string) {
	if db == nil {
		return
	}
	// Use async queue to prevent blocking
	go func() {
		_, err := db.Exec(`
			INSERT INTO bot_activity_log (bot_id, bot_username, action_type, target_user_id, target_username, details)
			VALUES (?, ?, ?, ?, ?, ?)
		`, botID, botUsername, actionType, targetUserID, targetUsername, details)
		if err != nil {
			log.Printf("Failed to log bot activity: %v", err)
		}
	}()
}

func simulateBot(bot Bot, config BotConfig, semaphore chan struct{}) {
	// Authenticate bot
	if err := authenticateBot(&bot, config); err != nil {
		log.Printf("Bot %s (%d) failed to authenticate: %v", bot.Username, bot.ID, err)
		return
	}

	log.Printf("Bot %s (%d) authenticated successfully (Pattern: %d)", bot.Username, bot.ID, bot.Pattern)

	// Set bot as online
	_, err := bot.DB.Exec("UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?", bot.ID)
	if err != nil {
		log.Printf("Failed to set bot %s online: %v", bot.Username, err)
	}

	// Update online status and last_seen periodically
	go updateOnlineStatus(bot, config)

	// Cleanup: Set offline when bot stops
	defer func() {
		_, err := bot.DB.Exec("UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?", bot.ID)
		if err != nil {
			log.Printf("Failed to set bot %s offline: %v", bot.Username, err)
		}
	}()

	// Perform actions based on pattern
	ticker := time.NewTicker(config.ActionInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			semaphore <- struct{}{} // Acquire semaphore
			performActionByPattern(bot, config)
			<-semaphore // Release semaphore
		}
	}
}

func updateOnlineStatus(bot Bot, config BotConfig) {
	// Update last_seen sporadically (every 30-60 seconds) to not overload database
	// Keep is_online = 1 (set once when bot starts)
	ticker := time.NewTicker(45 * time.Second) // Update every 45 seconds
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Update last_seen sporadically
			_, err := bot.DB.Exec("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?", bot.ID)
			if err != nil {
				log.Printf("Failed to update last_seen for bot %s: %v", bot.Username, err)
			}
		}
	}
}

func performActionByPattern(bot Bot, config BotConfig) {
	randVal := rand.Float32()

	switch bot.Pattern {
	case PatternExplorer:
		// Explorer: 48% view, 28% browse, 14% like, 8% disconnect, 2% other
		switch {
		case randVal < 0.48:
			visitProfile(bot, config)
		case randVal < 0.76:
			browseProfiles(bot, config)
		case randVal < 0.90:
			likeRandomProfile(bot, config)
		case randVal < 0.98:
			disconnectFromRandomConnection(bot, config)
		default:
			changeTags(bot, config)
		}
	case PatternLiker:
		// Liker: 48% like, 28% view, 14% browse, 8% disconnect, 2% other
		switch {
		case randVal < 0.48:
			likeRandomProfile(bot, config)
		case randVal < 0.76:
			visitProfile(bot, config)
		case randVal < 0.90:
			browseProfiles(bot, config)
		case randVal < 0.98:
			disconnectFromRandomConnection(bot, config)
		default:
			changeTags(bot, config)
		}
	case PatternSocial:
		// Social: 35% message, 27% like, 18% view, 12% disconnect, 8% other
		switch {
		case randVal < 0.35:
			sendMessageIfConnected(bot, config)
		case randVal < 0.62:
			likeRandomProfile(bot, config)
		case randVal < 0.80:
			visitProfile(bot, config)
		case randVal < 0.92:
			disconnectFromRandomConnection(bot, config)
		default:
			changeTags(bot, config)
		}
	case PatternActive:
		// Active: 22% like, 20% view, 18% browse, 18% message, 14% disconnect, 8% other
		switch {
		case randVal < 0.22:
			likeRandomProfile(bot, config)
		case randVal < 0.42:
			visitProfile(bot, config)
		case randVal < 0.60:
			browseProfiles(bot, config)
		case randVal < 0.78:
			sendMessageIfConnected(bot, config)
		case randVal < 0.92:
			disconnectFromRandomConnection(bot, config)
		default:
			changeTags(bot, config)
		}
	default: // PatternCasual
		// Casual: 32% browse, 22% visit, 20% like, 12% disconnect, 8% message, 6% other
		switch {
		case randVal < 0.32:
			browseProfiles(bot, config)
		case randVal < 0.54:
			visitProfile(bot, config)
		case randVal < 0.74:
			likeRandomProfile(bot, config)
		case randVal < 0.86:
			disconnectFromRandomConnection(bot, config)
		case randVal < 0.94:
			sendMessageIfConnected(bot, config)
		default:
			changeTags(bot, config)
		}
	}
}

// visitProfile - explicitly visits a profile (separate from viewing)
func visitProfile(bot Bot, config BotConfig) {
	profiles, err := browseProfilesWithBias(bot, config)
	if err != nil || len(profiles) == 0 {
		return
	}

	targetID := profiles[rand.Intn(len(profiles))].ID
	if targetID == bot.ID {
		return
	}

	// Visit the profile (GET /api/user/:id)
	req, _ := http.NewRequest("GET",
		fmt.Sprintf("%s/api/user/%d", config.ServerURL, targetID), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))

	resp, err := bot.Client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		// Get target username for logging
		var targetUsername string
		bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
		
		// Track this view for view-before-like logic (valid for 5 minutes)
		bot.viewMutex.Lock()
		bot.recentlyViewed[targetID] = time.Now()
		// Clean up old views (older than 5 minutes)
		for profileID, viewTime := range bot.recentlyViewed {
			if time.Since(viewTime) > 5*time.Minute {
				delete(bot.recentlyViewed, profileID)
			}
		}
		bot.viewMutex.Unlock()
		
		logBotActivity(bot.DB, bot.ID, bot.Username, "visit_profile", &targetID, targetUsername, "")
		log.Printf("✅ Bot %s successfully visited profile %d (%s)", bot.Username, targetID, targetUsername)
	} else {
		log.Printf("❌ Bot %s failed to visit profile %d (Status: %d)", bot.Username, targetID, resp.StatusCode)
	}
}

func likeRandomProfile(bot Bot, config BotConfig) {
	profiles, err := browseProfilesWithBias(bot, config)
	if err != nil || len(profiles) == 0 {
		return
	}

	// Filter to only profiles that were viewed recently (within last 5 minutes)
	bot.viewMutex.RLock()
	viewableProfiles := []Profile{}
	for _, profile := range profiles {
		if profile.ID == bot.ID {
			continue
		}
		if viewTime, viewed := bot.recentlyViewed[profile.ID]; viewed {
			if time.Since(viewTime) <= 5*time.Minute {
				viewableProfiles = append(viewableProfiles, profile)
			}
		}
	}
	bot.viewMutex.RUnlock()

	// If no recently viewed profiles, view one first
	if len(viewableProfiles) == 0 {
		// View a profile first, then like it
		visitProfile(bot, config)
		// Wait a bit before liking
		time.Sleep(2 * time.Second)
		// Try again with updated view list
		bot.viewMutex.RLock()
		for _, profile := range profiles {
			if profile.ID == bot.ID {
				continue
			}
			if viewTime, viewed := bot.recentlyViewed[profile.ID]; viewed {
				if time.Since(viewTime) <= 5*time.Minute {
					viewableProfiles = append(viewableProfiles, profile)
				}
			}
		}
		bot.viewMutex.RUnlock()
	}

	if len(viewableProfiles) == 0 {
		log.Printf("⚠️  Bot %s cannot like - no recently viewed profiles", bot.Username)
		return
	}

	// Pick a random profile from recently viewed ones
	targetID := viewableProfiles[rand.Intn(len(viewableProfiles))].ID

	// Like the profile
	req, _ := http.NewRequest("POST",
		fmt.Sprintf("%s/api/like/%d", config.ServerURL, targetID), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))

	resp, err := bot.Client.Do(req)
	if err != nil {
		log.Printf("❌ Bot %s failed to like profile %d: %v", bot.Username, targetID, err)
		logBotActivity(bot.DB, bot.ID, bot.Username, "like_profile_failed", &targetID, "", fmt.Sprintf("Error: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var targetUsername string
		bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
		logBotActivity(bot.DB, bot.ID, bot.Username, "like_profile", &targetID, targetUsername, "")
		log.Printf("✅ Bot %s successfully liked profile %d (%s) [viewed before]", bot.Username, targetID, targetUsername)
	} else {
		var targetUsername string
		bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
		logBotActivity(bot.DB, bot.ID, bot.Username, "like_profile_failed", &targetID, targetUsername, fmt.Sprintf("Status: %d", resp.StatusCode))
		log.Printf("❌ Bot %s failed to like profile %d (%s) - Status: %d", bot.Username, targetID, targetUsername, resp.StatusCode)
	}
}

func viewRandomProfile(bot Bot, config BotConfig) {
	profiles, err := browseProfilesWithBias(bot, config)
	if err != nil || len(profiles) == 0 {
		return
	}

	targetID := profiles[rand.Intn(len(profiles))].ID
	if targetID == bot.ID {
		return
	}

	// View the profile (this triggers a view record)
	req, _ := http.NewRequest("GET",
		fmt.Sprintf("%s/api/user/%d", config.ServerURL, targetID), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))

	resp, err := bot.Client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var targetUsername string
		bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
		
		// Track this view for view-before-like logic
		bot.viewMutex.Lock()
		bot.recentlyViewed[targetID] = time.Now()
		bot.viewMutex.Unlock()
		
		logBotActivity(bot.DB, bot.ID, bot.Username, "view_profile", &targetID, targetUsername, "")
		log.Printf("✅ Bot %s successfully viewed profile %d (%s)", bot.Username, targetID, targetUsername)
	} else {
		log.Printf("❌ Bot %s failed to view profile %d (Status: %d)", bot.Username, targetID, resp.StatusCode)
	}
}

// browseProfilesWithBias - gets profiles with bias toward non-bot users and higher fame rating
func browseProfilesWithBias(bot Bot, config BotConfig) ([]Profile, error) {
	profiles, err := browseProfiles(bot, config)
	if err != nil {
		return nil, err
	}

	// Separate bot and non-bot profiles, and fetch fame ratings
	var nonBotProfiles []Profile
	var botProfiles []Profile

	for _, profile := range profiles {
		if profile.ID == bot.ID {
			continue // Skip self
		}
		// Check if user is a bot and get fame rating
		var isBot int
		var fameRating float64
		err := bot.DB.QueryRow("SELECT is_bot, fame_rating FROM users WHERE id = ?", profile.ID).Scan(&isBot, &fameRating)
		if err != nil {
			continue
		}
		profile.IsBot = (isBot == 1)
		profile.FameRating = fameRating
		
		if isBot == 1 {
			botProfiles = append(botProfiles, profile)
		} else {
			nonBotProfiles = append(nonBotProfiles, profile)
		}
	}

	// Sort by fame rating (higher first) within each group
	sort.Slice(nonBotProfiles, func(i, j int) bool {
		return nonBotProfiles[i].FameRating > nonBotProfiles[j].FameRating
	})
	sort.Slice(botProfiles, func(i, j int) bool {
		return botProfiles[i].FameRating > botProfiles[j].FameRating
	})

	// Always favor non-bot users (is_bot = 0)
	// Only use bot profiles if no non-bot profiles exist
	result := []Profile{}
	if len(nonBotProfiles) > 0 {
		// Always pick from non-bot profiles with fame rating bias
		result = selectWithFameBias(nonBotProfiles)
	} else if len(botProfiles) > 0 {
		// Fallback to bot profiles only if no non-bot profiles available
		result = selectWithFameBias(botProfiles)
	} else {
		// Fallback to all profiles
		result = profiles
	}

	return result, nil
}

// selectWithFameBias selects a profile with higher probability for higher fame rating
// Uses weighted random selection where higher fame = higher probability
func selectWithFameBias(profiles []Profile) []Profile {
	if len(profiles) == 0 {
		return profiles
	}

	// Calculate weights based on fame rating (minimum weight of 1.0)
	weights := make([]float64, len(profiles))
	totalWeight := 0.0
	for i, profile := range profiles {
		// Weight = 1.0 + fame_rating (so even 0 fame gets weight 1.0)
		weights[i] = 1.0 + profile.FameRating
		totalWeight += weights[i]
	}

	// Weighted random selection - pick top 50% with 80% probability
	if rand.Float32() < 0.8 && len(profiles) > 1 {
		// Return top 50% (higher fame rating)
		topCount := len(profiles) / 2
		if topCount < 1 {
			topCount = 1
		}
		return profiles[:topCount]
	}

	// 20% chance to pick from all profiles (weighted)
	randVal := rand.Float64() * totalWeight
	currentWeight := 0.0
	for i, weight := range weights {
		currentWeight += weight
		if randVal <= currentWeight {
			return []Profile{profiles[i]}
		}
	}

	// Fallback to first profile
	return []Profile{profiles[0]}
}

func changeTags(bot Bot, config BotConfig) {
	// Get popular tags
	req, _ := http.NewRequest("GET", fmt.Sprintf("%s/api/tags/popular", config.ServerURL), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))

	resp, err := bot.Client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	var tagsResp PopularTagsResponse
	if err := json.NewDecoder(resp.Body).Decode(&tagsResp); err != nil {
		return
	}

	if !tagsResp.Success || len(tagsResp.Data.PopularTags) == 0 {
		return
	}

	// Randomly add or remove a tag
	if rand.Float32() < 0.5 {
		// Add a random tag
		tag := tagsResp.Data.PopularTags[rand.Intn(len(tagsResp.Data.PopularTags))].Tag
		tagData := map[string]string{"tag": tag}
		jsonData, _ := json.Marshal(tagData)

		req, _ := http.NewRequest("POST",
			fmt.Sprintf("%s/api/tags/add", config.ServerURL),
			bytes.NewBuffer(jsonData))
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))
		req.Header.Set("Content-Type", "application/json")

		resp, err := bot.Client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			logBotActivity(bot.DB, bot.ID, bot.Username, "add_tag", nil, "", tag)
			log.Printf("✅ Bot %s successfully added tag: %s", bot.Username, tag)
		} else {
			log.Printf("❌ Bot %s failed to add tag %s (Status: %d)", bot.Username, tag, resp.StatusCode)
		}
	}
}

// getConnections returns the bot's connections (mutual likes). Caller must not reuse the slice.
func getConnections(bot Bot, config BotConfig) ([]int64, error) {
	req, _ := http.NewRequest("GET", fmt.Sprintf("%s/api/connections", config.ServerURL), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))
	resp, err := bot.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	var connResp struct {
		Success bool `json:"success"`
		Data    []struct {
			ID int64 `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&connResp); err != nil {
		return nil, err
	}
	if !connResp.Success {
		return nil, fmt.Errorf("connections not success")
	}
	ids := make([]int64, 0, len(connResp.Data))
	for _, c := range connResp.Data {
		ids = append(ids, c.ID)
	}
	return ids, nil
}

// disconnectFromRandomConnection makes the bot unlike a random connection (disconnect), so they can form new connections with different users.
func disconnectFromRandomConnection(bot Bot, config BotConfig) {
	connections, err := getConnections(bot, config)
	if err != nil || len(connections) == 0 {
		return
	}
	targetID := connections[rand.Intn(len(connections))]
	req, _ := http.NewRequest("POST",
		fmt.Sprintf("%s/api/unlike/%d", config.ServerURL, targetID), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))
	resp, err := bot.Client.Do(req)
	if err != nil {
		log.Printf("❌ Bot %s failed to disconnect from %d: %v", bot.Username, targetID, err)
		logBotActivity(bot.DB, bot.ID, bot.Username, "unlike_failed", &targetID, "", fmt.Sprintf("Error: %v", err))
		return
	}
	defer resp.Body.Close()
	var targetUsername string
	bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
	if resp.StatusCode == http.StatusOK {
		logBotActivity(bot.DB, bot.ID, bot.Username, "unlike_profile", &targetID, targetUsername, "")
		log.Printf("✅ Bot %s disconnected from profile %d (%s) (replacing with different users)", bot.Username, targetID, targetUsername)
	} else {
		logBotActivity(bot.DB, bot.ID, bot.Username, "unlike_failed", &targetID, targetUsername, fmt.Sprintf("Status: %d", resp.StatusCode))
		log.Printf("❌ Bot %s failed to disconnect from %d (%s) - Status: %d", bot.Username, targetID, targetUsername, resp.StatusCode)
	}
}

func sendMessageIfConnected(bot Bot, config BotConfig) {
	connections, err := getConnections(bot, config)
	if err != nil || len(connections) == 0 {
		return
	}
	targetID := connections[rand.Intn(len(connections))]

	// Send a message
	messages := []string{
		"Hey! How are you?",
		"Hi there!",
		"What's up?",
		"Hello!",
		"Nice to meet you!",
		"Hope you're having a great day!",
		"How's it going?",
	}

	messageContent := messages[rand.Intn(len(messages))]
	messageData := map[string]string{
		"content": messageContent,
	}
	jsonData, _ := json.Marshal(messageData)

	msgReq, _ := http.NewRequest("POST",
		fmt.Sprintf("%s/api/messages/%d", config.ServerURL, targetID),
		bytes.NewBuffer(jsonData))
	msgReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))
	msgReq.Header.Set("Content-Type", "application/json")

	resp, err := bot.Client.Do(msgReq)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var targetUsername string
		bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
		logBotActivity(bot.DB, bot.ID, bot.Username, "send_message", &targetID, targetUsername, messageContent)
		log.Printf("✅ Bot %s successfully sent message to user %d (%s): \"%s\"", bot.Username, targetID, targetUsername, messageContent)
	} else {
		var targetUsername string
		bot.DB.QueryRow("SELECT username FROM users WHERE id = ?", targetID).Scan(&targetUsername)
		logBotActivity(bot.DB, bot.ID, bot.Username, "send_message_failed", &targetID, targetUsername, fmt.Sprintf("Status: %d", resp.StatusCode))
		log.Printf("❌ Bot %s failed to send message to user %d (%s) - Status: %d", bot.Username, targetID, targetUsername, resp.StatusCode)
	}
}

func browseProfiles(bot Bot, config BotConfig) ([]Profile, error) {
	req, _ := http.NewRequest("GET",
		fmt.Sprintf("%s/api/browse?limit=20", config.ServerURL), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", bot.Token))

	resp, err := bot.Client.Do(req)
	if err != nil {
		log.Printf("❌ Bot %s failed to browse profiles: %v", bot.Username, err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ Bot %s browse returned status %d", bot.Username, resp.StatusCode)
		return nil, fmt.Errorf("browse returned status %d", resp.StatusCode)
	}

	var browseResp BrowseResponse
	if err := json.NewDecoder(resp.Body).Decode(&browseResp); err != nil {
		log.Printf("❌ Bot %s failed to decode browse response: %v", bot.Username, err)
		return nil, err
	}

	if !browseResp.Success {
		log.Printf("❌ Bot %s browse failed: %s", bot.Username, browseResp.Error)
		return nil, fmt.Errorf("browse failed: %s", browseResp.Error)
	}

	logBotActivity(bot.DB, bot.ID, bot.Username, "browse_profiles", nil, "", fmt.Sprintf("Found %d profiles", len(browseResp.Data.Profiles)))
	log.Printf("✅ Bot %s successfully browsed profiles (found %d)", bot.Username, len(browseResp.Data.Profiles))
	return browseResp.Data.Profiles, nil
}
