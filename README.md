# Matcha - Dating Website

## Introduction

This project aims to create a dating website. We set out to develop an application that facilitates connections between two potential kindred spirits, covering their entire life-changing entwinement from registration on our platform to the final meeting.

Users of Matcha can:
- Register
- Log in
- Complete their profile
- **Search** for and view other users' profiles
- Express ***approval of vibes*** in them with a 'like'
- _Ngl, samee?_ Chat with those who have reciprocated your interest

## Technology Stack

**Language:**
- Goji for Golang

**Data:**
- `matcha.db` using cheeky custom library for query management simple way

**Additional:**
- We leverage micro-frameworks and any necessary libraries for this project
- We use UI libraries such as React, Angular, Vue, Bootstrap, Semantic, or any combination of them

## Testing

- 500 user profiles

## Features

### Authentication & Account Management

**Modern Website Feel:**
1. Sign-up (with mailhog verification of email)
2. Recovery of profile

### User Profile

Once logged in, users must complete their profile by providing the following information:
- Gender
- Sexual preferences
- A biography
- A list of interests using tags (e.g., #vegan, #geek, #piercing, etc.), which must be reusable
- Up to 5 pictures, including one designated as the profile picture

**Profile Management:**
- Users must be able to modify this information at any time, as well as update their last name, first name, and email address
- Users must be able to see who has viewed their profile
- Users must also be able to see who has "liked" them
- Each user must have a public "fame rating"<sup>1</sup>

**Location:**
- Users must be located via GPS positioning down to their neighborhood, with their explicit consent
- If a user opts out of GPS location tracking, they must manually provide their approximate location (city or neighborhood) to use the matching features
- This manual location entry is required for the application to function properly<sup>2</sup>
- Users must also have the option to modify their location in their profile at any time

### Browsing

Users must be able to easily access a list of suggested profiles that match their preferences.

**Matching Logic:**
- You should suggest "interesting" profiles. For example, a heterosexual woman should only see male profiles
- You must also handle bisexuality
- If a user has not specified their orientation, they should be considered bisexual by default
- Matches must be intelligently determined<sup>3</sup> based on:
  - Proximity to the user's geographical location
  - The highest number of shared tags
  - The highest "fame rating"
- Priority should be given to users within the same geographical area

**Sorting & Filtering:**
- The list of suggested profiles must be sortable by age, location, "fame rating", and common tags
- Users must be able to filter the list based on age, location, "fame rating", and common tags

### Advanced Search

Users must be able to perform an advanced search by selecting one or more criteria, such as:
- A specific age range
- A "fame rating" range
- A location
- One or multiple interest tags

Similar to the suggested list, the search results must be sortable and filterable by age, location, "fame rating", and interest tags.

### Profile View

Users must be able to view other users' profiles.

**Profile Display:**
- Profiles should display all available information except for the email address and password
- When a user views a profile, it must be recorded in their visit history

**Profile Actions:**
- "Like" another user's profile picture. When two users mutually "like" each other's profiles, they will be considered "connected" and can start chatting. If the current user does not have a profile picture, they cannot perform this action
- Remove a previously given "like". This will prevent further notifications from that user, and the chat function between them will be disabled
- Check another user's "fame rating"
- See whether a user is currently online, and if not, view the date and time of their last connection
- Report a user as a "fake account"
- Block a user. A blocked user will no longer appear in search results or generate notifications. Additionally, chatting with them will no longer be possible

**Connection Status:**
- Users must clearly see if the profile they are viewing has "liked" them or if they are already "connected"
- They must also have the option to "unlike" or disconnect from that profile

### Chat

When two users are connected<sup>4</sup>, they must be able to "chat" in real-time<sup>5</sup>.

- The implementation of the chat feature is up to you
- However, users must be able to see, from any page, when they receive a new message

### Notifications

Users must receive real-time notifications<sup>6</sup> for the following events:
- When they receive a "like"
- When their profile has been viewed
- When they receive a message
- When a user they "liked" also "likes" them back
- When a connected user "unlikes" them

Users must be able to see, from any page, when they have unread notifications.

---


## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- SQLite3

### Installation

1. **Install backend dependencies:**
   ```bash
   go mod tidy
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend && npm install
   ```

3. **Initialize database:**
   ```bash
   make init-db
   ```

4. **Build frontend:**
   ```bash
   make frontend-build
   ```

5. **Run backend:**
   ```bash
   make run
   ```

Visit `http://localhost:8080`

## 📁 Project Structure

```
matcha/
├── cmd/
│   └── server/          # Main application entry point
├── internal/            # Private application code
│   ├── config/          # Configuration
│   ├── database/        # Database setup
│   ├── handlers/        # API handlers
│   └── models/          # Data models
├── migrations/          # Database migrations
├── web/                 # React + HeroUI frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   └── components/ # Reusable components
│   └── package.json
├── static/              # Static files (served by Go)
│   └── dist/           # Built React app
├── scripts/             # Utility scripts
├── docs/               # Documentation
└── data/               # Database files (gitignored)
```

See [Structure Review](docs/STRUCTURE_REVIEW.md) for details.

## 🛠️ Development

### Development Mode (with hot reload)

**Terminal 1 - Backend:**
```bash
make run
```

**Terminal 2 - Frontend:**
```bash
make frontend-dev
```

Frontend runs on `http://localhost:3000` and proxies API calls to backend.

### Production Build

```bash
make build-all  # Builds both frontend and backend
```

## 📚 Documentation

- [Setup Guide](docs/INTEGRATED_SETUP.md) - Complete setup instructions
- [Frontend Setup](docs/FRONTEND_SETUP.md) - React + HeroUI details
- [API Documentation](docs/API.md) - API endpoints (coming soon)

## 🏗️ Technology Stack

- **Backend**: Go, Goji, SQLite
- **Frontend**: React, HeroUI, Tailwind CSS, Vite
- **Email**: MailHog (development)

## 📝 Features

- User registration and authentication
- Profile management with photos and tags
- Smart matching algorithm
- Real-time chat
- Notifications
- Browse and search profiles

## 🧪 Testing

```bash
make test
```

## 📦 Build

```bash
make build        # Backend only
make frontend-build  # Frontend only
make build-all    # Both
```

## 🐳 Docker

**Quick Start (builds and runs everything):**
```bash
docker compose up --build
```

**Note:** If you want to customize settings, copy `.env.example` to `.env`:
```bash
cp .env.example .env
# Edit .env as needed
```

The `.env` file is optional - defaults will be used if it doesn't exist.

Or use Make:
```bash
make docker-up-build
```

**Other Docker commands:**
```bash
make docker-build    # Build only
make docker-up       # Run (without rebuild)
make docker-down     # Stop containers
make docker-logs     # View logs
```

This will:
- Build the React frontend
- Build the Go backend
- Start the application on `http://localhost:8080`
- Start MailHog on `http://localhost:8025`

## 📄 License

[Your License Here]
