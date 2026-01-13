# Matcha - Dating Website

A modern dating website built with Go (Goji) backend and React + HeroUI frontend.

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
