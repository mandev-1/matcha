package main

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var (
	maleFirstNames = []string{
		"James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
		"Thomas", "Charles", "Christopher", "Daniel", "Matthew", "Anthony", "Mark",
		"Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
		"George", "Timothy", "Ronald", "Jason", "Edward", "Jeffrey", "Ryan", "Jacob",
		"Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon",
		"Benjamin", "Samuel", "Raymond", "Gregory", "Frank", "Alexander", "Patrick", "Jack",
	}
	femaleFirstNames = []string{
		"Emma", "Olivia", "Sophia", "Isabella", "Charlotte", "Amelia", "Mia", "Harper",
		"Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Sofia",
		"Camila", "Aria", "Scarlett", "Victoria", "Madison", "Luna", "Grace", "Chloe",
		"Penelope", "Layla", "Zoey", "Nora", "Lily", "Eleanor", "Hannah",
		"Lillian", "Addison", "Aubrey", "Ellie", "Stella", "Natalie", "Zoe", "Leah",
		"Hazel", "Violet", "Aurora", "Savannah", "Audrey", "Brooklyn", "Bella", "Claire",
		"Skylar", "Lucy", "Paisley", "Everly", "Anna", "Caroline", "Nova", "Genesis",
	}

	lastNames = []string{
		"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
		"Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
		"Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
		"Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
		"Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
		"Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
	}

	bios = []string{
		"Love traveling and exploring new places. Coffee enthusiast and bookworm.",
		"Fitness enthusiast, yoga instructor, and nature lover. Always up for an adventure!",
		"Software developer by day, photographer by night. Passionate about art and technology.",
		"Foodie who loves trying new restaurants. Always looking for the next great meal.",
		"Musician and music producer. Love creating and discovering new sounds.",
		"Teacher and lifelong learner. Passionate about education and making a difference.",
		"Entrepreneur building the next big thing. Love networking and meeting new people.",
		"Artist and creative soul. Expressing myself through painting and digital art.",
		"Fitness coach helping people reach their goals. Love hiking and outdoor activities.",
		"Writer and storyteller. Always have a book in hand and a story to tell.",
		"Chef and food blogger. Sharing my culinary adventures with the world.",
		"Travel blogger documenting my journey around the globe. Adventure seeker!",
		"Photographer capturing life's beautiful moments. Love nature and urban exploration.",
		"Yoga instructor and wellness coach. Helping others find balance and peace.",
		"Engineer solving complex problems. Love coding, hiking, and good conversations.",
		"Marketing professional with a passion for creativity. Love design and strategy.",
		"Doctor dedicated to helping others. Love reading, traveling, and good food.",
		"Lawyer passionate about justice. Love debating, reading, and intellectual conversations.",
		"Architect designing beautiful spaces. Love art, design, and sustainable living.",
		"Designer creating beautiful experiences. Love minimalism, art, and innovation.",
	}

	tags = []string{
		"#travel", "#food", "#fitness", "#music", "#art", "#photography", "#yoga",
		"#coffee", "#books", "#technology", "#gaming", "#hiking", "#cooking", "#dancing",
		"#movies", "#writing", "#fashion", "#sports", "#nature", "#adventure", "#wine",
		"#beer", "#vegan", "#vegetarian", "#glutenfree", "#keto", "#paleo", "#meditation",
		"#mindfulness", "#wellness", "#entrepreneur", "#startup", "#business", "#finance",
		"#investing", "#crypto", "#blockchain", "#ai", "#ml", "#coding", "#webdev",
	}

	genders = []string{"male", "female"}
	preferences = []string{"male", "female", "both"}
	mbtiTypes = []string{"INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
		"ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"}
	bigFiveLevels = []string{"low", "medium", "high"}
	siblings = []string{"middle_child", "slightly_older_siblings", "oldest_child", "youngest_child", "only_child", "twin"}
	caliperProfiles = []string{"analytical", "conceptual", "social", "structured"}
)

func getAvailableImages(imageDir string) ([]string, error) {
	var images []string
	err := filepath.Walk(imageDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			ext := strings.ToLower(filepath.Ext(path))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
				images = append(images, path)
			}
		}
		return nil
	})
	return images, err
}

// ensurePlaceholderImages runs the Python script to generate a 500x500 black JPEG
// with a bot silhouette in imageDir when no images are available. Returns the
// same directory path so the caller can re-scan.
func ensurePlaceholderImages(imageDir string) error {
	scriptPath := "scripts/generate_bot_placeholder.py"
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		return fmt.Errorf("placeholder script not found: %s", scriptPath)
	}
	outPath := filepath.Join(imageDir, "placeholder_bot.jpg")
	if err := os.MkdirAll(imageDir, 0755); err != nil {
		return fmt.Errorf("failed to create image dir: %w", err)
	}
	cmd := exec.Command("python3", scriptPath, "-o", outPath)
	if err := cmd.Run(); err != nil {
		// try "python" as fallback
		cmd = exec.Command("python", scriptPath, "-o", outPath)
		if err = cmd.Run(); err != nil {
			return fmt.Errorf("running placeholder script: %w", err)
		}
	}
	return nil
}

func copyImage(srcPath, destPath string) error {
	// Create destination directory if it doesn't exist
	destDir := filepath.Dir(destPath)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %v", destDir, err)
	}

	// Open source file
	src, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("failed to open source file: %v", err)
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	// Copy file contents
	_, err = io.Copy(dst, src)
	if err != nil {
		return fmt.Errorf("failed to copy file: %v", err)
	}

	return nil
}

func main() {
	if len(maleFirstNames) == 0 || len(femaleFirstNames) == 0 || len(lastNames) == 0 {
		log.Fatal("First names or last names list is empty")
	}

	// Get available images; if none, generate placeholder(s) via Python script
	imageDir := "./data/extracted_images"
	if err := os.MkdirAll(imageDir, 0755); err != nil {
		log.Fatalf("Failed to create images directory: %v", err)
	}
	availableImages, err := getAvailableImages(imageDir)
	if err != nil {
		log.Fatalf("Failed to read images directory: %v", err)
	}
	if len(availableImages) == 0 {
		log.Printf("No images in %s; generating placeholder bot silhouette JPEG...", imageDir)
		if err := ensurePlaceholderImages(imageDir); err != nil {
			log.Fatalf("Failed to generate placeholder images: %v", err)
		}
		availableImages, err = getAvailableImages(imageDir)
		if err != nil || len(availableImages) == 0 {
			log.Fatalf("Failed to read images after generating placeholders: %v", err)
		}
	}
	log.Printf("Found %d available images", len(availableImages))

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

	// Ensure uploads directory exists
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		log.Fatalf("Failed to create uploads directory: %v", err)
	}

	rand.Seed(time.Now().UnixNano())

	numUsers := 500
	log.Printf("Generating %d test users...", numUsers)

	for i := 0; i < numUsers; i++ {
		gender := genders[rand.Intn(len(genders))]
		var firstName string
		if gender == "male" {
			firstName = maleFirstNames[rand.Intn(len(maleFirstNames))]
		} else {
			firstName = femaleFirstNames[rand.Intn(len(femaleFirstNames))]
		}
		lastName := lastNames[rand.Intn(len(lastNames))]
		username := fmt.Sprintf("bot_%s_%s_%d", firstName, lastName, i+1)
		email := fmt.Sprintf("bot_%d_%s_%s@test.com", i+1, firstName, lastName)

		// Generate password hash
		passwordHash, err := bcrypt.GenerateFromPassword([]byte("test123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error generating password hash: %v", err)
			continue
		}

		// Random age between 18 and 65
		age := rand.Intn(48) + 18
		birthYear := time.Now().Year() - age
		birthMonth := rand.Intn(12) + 1
		birthDay := rand.Intn(28) + 1
		birthDate := fmt.Sprintf("%d-%02d-%02d", birthYear, birthMonth, birthDay)

		preference := preferences[rand.Intn(len(preferences))]
		bio := bios[rand.Intn(len(bios))]
		fameRating := rand.Float64()*2.0 + 3.0 // Between 3.0 and 5.0

		// Real city coordinates (major cities worldwide)
		cities := []struct {
			name      string
			latitude  float64
			longitude float64
		}{
			{"New York", 40.7128, -74.0060},
			{"Los Angeles", 34.0522, -118.2437},
			{"Chicago", 41.8781, -87.6298},
			{"Houston", 29.7604, -95.3698},
			{"Phoenix", 33.4484, -112.0740},
			{"Philadelphia", 39.9526, -75.1652},
			{"San Antonio", 29.4241, -98.4936},
			{"San Diego", 32.7157, -117.1611},
			{"Dallas", 32.7767, -96.7970},
			{"San Jose", 37.3382, -121.8863},
			{"London", 51.5074, -0.1278},
			{"Paris", 48.8566, 2.3522},
			{"Berlin", 52.5200, 13.4050},
			{"Madrid", 40.4168, -3.7038},
			{"Rome", 41.9028, 12.4964},
			{"Amsterdam", 52.3676, 4.9041},
			{"Vienna", 48.2082, 16.3738},
			{"Barcelona", 41.3851, 2.1734},
			{"Milan", 45.4642, 9.1900},
			{"Munich", 48.1351, 11.5820},
			{"Tokyo", 35.6762, 139.6503},
			{"Shanghai", 31.2304, 121.4737},
			{"Beijing", 39.9042, 116.4074},
			{"Seoul", 37.5665, 126.9780},
			{"Hong Kong", 22.3193, 114.1694},
			{"Singapore", 1.3521, 103.8198},
			{"Bangkok", 13.7563, 100.5018},
			{"Mumbai", 19.0760, 72.8777},
			{"Delhi", 28.6139, 77.2090},
			{"Sydney", -33.8688, 151.2093},
			{"Melbourne", -37.8136, 144.9631},
			{"Auckland", -36.8485, 174.7633},
			{"Toronto", 43.6532, -79.3832},
			{"Vancouver", 49.2827, -123.1207},
			{"Montreal", 45.5017, -73.5673},
			{"São Paulo", -23.5505, -46.6333},
			{"Rio de Janeiro", -22.9068, -43.1729},
			{"Buenos Aires", -34.6037, -58.3816},
			{"Mexico City", 19.4326, -99.1332},
			{"Lima", -12.0464, -77.0428},
			{"Cairo", 30.0444, 31.2357},
			{"Johannesburg", -26.2041, 28.0473},
			{"Dubai", 25.2048, 55.2708},
			{"Istanbul", 41.0082, 28.9784},
			{"Moscow", 55.7558, 37.6173},
			{"St. Petersburg", 59.9343, 30.3351},
			{"Warsaw", 52.2297, 21.0122},
			{"Prague", 50.0755, 14.4378},
			{"Stockholm", 59.3293, 18.0686},
			{"Copenhagen", 55.6761, 12.5683},
			{"Oslo", 59.9139, 10.7522},
			{"Helsinki", 60.1699, 24.9384},
		}

		city := cities[rand.Intn(len(cities))]
		// Add small random offset to simulate users in the same city but different locations
		latitude := city.latitude + (rand.Float64()-0.5)*0.1  // ±0.05 degrees (~5.5km)
		longitude := city.longitude + (rand.Float64()-0.5)*0.1 // ±0.05 degrees
		location := city.name

		// Insert user
		result, err := db.Exec(`
			INSERT INTO users (
				username, email, password_hash, first_name, last_name,
				gender, sexual_preference, biography, birth_date,
				fame_rating, latitude, longitude, location,
				is_email_verified, is_setup, is_bot, last_seen, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`, username, email, string(passwordHash), firstName, lastName,
			gender, preference, bio, birthDate, fameRating, latitude, longitude, location)

		if err != nil {
			log.Printf("Error inserting user %d: %v", i+1, err)
			continue
		}

		userID, err := result.LastInsertId()
		if err != nil {
			log.Printf("Error getting user ID: %v", err)
			continue
		}

		// Add random tags (1-5 tags)
		numTags := rand.Intn(5) + 1
		selectedTags := make(map[string]bool)
		for j := 0; j < numTags; j++ {
			tag := tags[rand.Intn(len(tags))]
			if !selectedTags[tag] {
				selectedTags[tag] = true
				_, err := db.Exec("INSERT INTO user_tags (user_id, tag) VALUES (?, ?)", userID, tag)
				if err != nil {
					log.Printf("Error inserting tag: %v", err)
				}
			}
		}

		// Add personality traits
		openness := bigFiveLevels[rand.Intn(len(bigFiveLevels))]
		conscientiousness := bigFiveLevels[rand.Intn(len(bigFiveLevels))]
		extraversion := bigFiveLevels[rand.Intn(len(bigFiveLevels))]
		agreeableness := bigFiveLevels[rand.Intn(len(bigFiveLevels))]
		neuroticism := bigFiveLevels[rand.Intn(len(bigFiveLevels))]
		sibling := siblings[rand.Intn(len(siblings))]
		mbti := mbtiTypes[rand.Intn(len(mbtiTypes))]
		caliper := caliperProfiles[rand.Intn(len(caliperProfiles))]

		_, err = db.Exec(`
			UPDATE users SET
				openness = ?, conscientiousness = ?, extraversion = ?,
				agreeableness = ?, neuroticism = ?,
				siblings = ?, mbti = ?, caliper_profile = ?
			WHERE id = ?
		`, openness, conscientiousness, extraversion, agreeableness, neuroticism,
			sibling, mbti, caliper, userID)

		if err != nil {
			log.Printf("Error updating personality traits: %v", err)
		}

		// Assign a random profile image
		if len(availableImages) > 0 {
			randomImage := availableImages[rand.Intn(len(availableImages))]
			
			// Get file extension
			ext := filepath.Ext(randomImage)
			if ext == "" {
				ext = ".jpg" // Default to jpg
			}
			
			// Generate unique filename
			timestamp := time.Now().UnixNano()
			randomHex := fmt.Sprintf("%x", rand.Int63())
			filename := fmt.Sprintf("%s_%d_%s%s", randomHex, timestamp, "profile", ext)
			
			// Destination path: uploads/{userID}/{filename}
			userUploadDir := fmt.Sprintf("./uploads/%d", userID)
			destPath := filepath.Join(userUploadDir, filename)
			
			// Copy image to user's upload directory
			if err := copyImage(randomImage, destPath); err != nil {
				log.Printf("Error copying image for user %d: %v", userID, err)
			} else {
				// Store relative path for database (/uploads/{userID}/{filename})
				relativePath := fmt.Sprintf("/uploads/%d/%s", userID, filename)
				
				// Insert into user_pictures table
				result, err := db.Exec(`
					INSERT INTO user_pictures (user_id, file_path, is_profile, order_index, created_at)
					VALUES (?, ?, 1, 0, CURRENT_TIMESTAMP)
				`, userID, relativePath)
				
				if err != nil {
					log.Printf("Error inserting profile picture: %v", err)
				} else {
					// Get the inserted picture ID
					pictureID, err := result.LastInsertId()
					if err != nil {
						log.Printf("Error getting picture ID: %v", err)
					} else {
						// Update user's profile_picture_id
						_, err = db.Exec("UPDATE users SET profile_picture_id = ? WHERE id = ?", pictureID, userID)
						if err != nil {
							log.Printf("Error updating profile_picture_id: %v", err)
						}
					}
				}
			}
		}

		if (i+1)%50 == 0 {
			log.Printf("Generated %d/%d users...", i+1, numUsers)
		}
	}

	log.Printf("Successfully generated %d test users!", numUsers)
}
