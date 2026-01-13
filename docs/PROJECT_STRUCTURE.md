# Project Structure

## Directory Organization

```
matcha/
├── main.go                 # Application entry point
├── go.mod                  # Go module definition
├── go.sum                  # Go dependencies checksum
├── Makefile                # Build and development commands
├── Dockerfile              # Docker container definition
├── docker-compose.yml      # Docker Compose configuration
├── README.md               # Main project documentation
│
├── config/                 # Configuration management
│   └── config.go          # Environment configuration
│
├── database/               # Database setup
│   ├── database.go        # Database connection
│   └── schema.sql         # Database schema
│
├── handlers/              # API handlers (JSON responses)
│   ├── api_helper.go      # JSON response helpers
│   ├── api_routes.go      # API route setup
│   ├── auth.go            # Authentication endpoints
│   ├── profile.go          # Profile endpoints
│   ├── browse.go          # Browse/Search endpoints
│   ├── chat.go            # Chat endpoints
│   ├── interactions.go    # Like/Unlike endpoints
│   ├── api.go             # Notifications endpoint
│   └── index.go           # Home/index endpoint
│
├── models/                # Data models
│   └── user.go            # User model definitions
│
├── frontend/              # React + HeroUI frontend
│   ├── package.json       # NPM dependencies
│   ├── vite.config.js     # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── postcss.config.js  # PostCSS configuration
│   ├── index.html         # HTML entry point
│   └── src/
│       ├── main.jsx       # React entry point
│       ├── App.jsx        # Main app component
│       ├── index.css      # Global styles
│       ├── components/    # Reusable components
│       │   └── Layout.jsx # Layout component
│       └── pages/         # Page components
│           ├── Home.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Profile.jsx
│           ├── Browse.jsx
│           ├── Chat.jsx
│           └── ViewUser.jsx
│
├── static/                # Static files served by Go
│   ├── css/               # Legacy CSS (can be removed)
│   ├── js/                # Legacy JS (can be removed)
│   └── dist/              # Built React app (generated)
│
├── scripts/               # Utility scripts
│   ├── install-hero.sh    # Install Hero template engine
│   └── fix-deps.sh        # Fix Go dependencies
│
├── docs/                  # Documentation
│   ├── API.md             # API endpoint documentation
│   ├── INTEGRATED_SETUP.md # Setup guide
│   ├── FRONTEND_SETUP.md   # Frontend setup details
│   └── ...                # Other documentation
│
└── data/                  # Runtime data (gitignored)
    └── matcha.db          # SQLite database
```

## Key Directories

### `/handlers`
Contains all API endpoint handlers. Each file handles a specific domain:
- `auth.go` - Authentication (login, register, logout)
- `profile.go` - User profile management
- `browse.go` - Profile browsing and searching
- `chat.go` - Chat functionality
- `interactions.go` - Like/unlike actions
- `api.go` - Notifications

### `/frontend`
Complete React application with HeroUI components. Built with Vite for fast development.

### `/static/dist`
Output directory for built React app. This is served by the Go backend for production.

### `/docs`
All project documentation organized in one place.

### `/scripts`
Utility scripts for development and setup.

## File Naming Conventions

- **Go files**: `snake_case.go` (e.g., `api_helper.go`)
- **React components**: `PascalCase.jsx` (e.g., `Home.jsx`)
- **Config files**: `kebab-case` (e.g., `tailwind.config.js`)

## Build Outputs

- `matcha` - Compiled Go binary (in root, gitignored)
- `static/dist/` - Built React app (gitignored)
- `data/*.db` - Database files (gitignored)

