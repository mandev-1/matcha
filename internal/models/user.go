package models

import "time"

// User represents a user in the system
type User struct {
	ID                int64     `json:"id"`
	Email             string    `json:"email"`
	PasswordHash      string    `json:"-"` // Never expose password hash
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	Gender            string    `json:"gender"`
	SexualPreference  string    `json:"sexual_preference"`
	Biography         string    `json:"biography"`
	BirthDate         time.Time `json:"birth_date"`
	FameRating        float64   `json:"fame_rating"`
	Latitude          float64   `json:"latitude"`
	Longitude         float64   `json:"longitude"`
	Location          string    `json:"location"`
	IsEmailVerified   bool      `json:"is_email_verified"`
	IsOnline          bool      `json:"is_online"`
	LastSeen          time.Time `json:"last_seen"`
	ProfilePictureID  int64     `json:"profile_picture_id"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// UserPicture represents a user's uploaded picture
type UserPicture struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	FilePath  string    `json:"file_path"`
	IsProfile bool      `json:"is_profile"`
	Order     int       `json:"order"`
	CreatedAt time.Time `json:"created_at"`
}

// UserTag represents a user's interest tag
type UserTag struct {
	ID     int64  `json:"id"`
	UserID int64  `json:"user_id"`
	Tag    string `json:"tag"`
}

// Like represents a like between two users
type Like struct {
	ID        int64     `json:"id"`
	FromUserID int64   `json:"from_user_id"`
	ToUserID  int64     `json:"to_user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// View represents a profile view
type View struct {
	ID        int64     `json:"id"`
	ViewerID  int64     `json:"viewer_id"`
	ViewedID  int64     `json:"viewed_id"`
	CreatedAt time.Time `json:"created_at"`
}

// Message represents a chat message
type Message struct {
	ID        int64     `json:"id"`
	FromUserID int64   `json:"from_user_id"`
	ToUserID  int64     `json:"to_user_id"`
	Content   string    `json:"content"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// Notification represents a user notification
type Notification struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Type      string    `json:"type"` // "like", "view", "message", "match", "unlike"
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}


