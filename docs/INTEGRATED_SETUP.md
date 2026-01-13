# Integrated Setup: Go Backend + React/HeroUI Frontend

This project uses:
- **Backend**: Go (Goji) - API server
- **Frontend**: React + HeroUI - Served by Go backend

## Architecture

```
┌─────────────────────────────────┐
│   Go Backend (Port 8080)       │
│                                 │
│   ┌─────────────────────────┐  │
│   │  API Routes (/api/*)    │  │
│   │  - Returns JSON         │  │
│   └─────────────────────────┘  │
│                                 │
│   ┌─────────────────────────┐  │
│   │  Static Files           │  │
│   │  - React build (/*)     │  │
│   │  - Assets (/assets/*)   │  │
│   └─────────────────────────┘  │
└─────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
go mod tidy
```

**Frontend:**
```bash
cd frontend
npm install
```

Or use Make:
```bash
make frontend-install
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

Or use Make:
```bash
make frontend-build
```

This builds the React app and outputs to `static/dist/` which the Go server serves.

### 3. Run Backend

```bash
go run main.go
```

Or use Make:
```bash
make run
```

The server will start on `http://localhost:8080` and serve:
- React app at `/` (and all routes)
- API endpoints at `/api/*`

## Development Workflow

### Option 1: Separate Development Servers (Recommended for Development)

**Terminal 1 - Backend:**
```bash
go run main.go
```

**Terminal 2 - Frontend (with hot reload):**
```bash
cd frontend
npm run dev
```

Frontend dev server runs on `http://localhost:3000` and proxies API calls to `http://localhost:8080`.

### Option 2: Integrated (Production-like)

1. Build frontend: `make frontend-build`
2. Run backend: `make run`
3. Access at `http://localhost:8080`

## Project Structure

```
matcha/
├── main.go              # Go server entry point
├── handlers/            # API handlers (JSON responses)
│   ├── api_routes.go   # API route setup
│   ├── auth.go         # Authentication API
│   ├── profile.go      # Profile API
│   ├── browse.go       # Browse/Search API
│   ├── chat.go         # Chat API
│   └── ...
├── frontend/            # React + HeroUI app
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
└── static/
    └── dist/           # Built React app (served by Go)
```

## API Endpoints

All API endpoints return JSON:

- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/profile` - Get current user profile
- `POST /api/profile` - Update profile
- `GET /api/browse` - Browse profiles
- `GET /api/user/:id` - Get user profile
- `POST /api/like/:id` - Like a user
- `POST /api/unlike/:id` - Unlike a user
- `GET /api/chat` - Get chat list
- `GET /api/messages/:id` - Get messages
- `POST /api/messages/:id` - Send message
- `GET /api/notifications` - Get notifications

## Frontend Routes

React Router handles all frontend routes:
- `/` - Home
- `/login` - Login page
- `/register` - Registration page
- `/profile` - User profile
- `/browse` - Browse profiles
- `/chat` - Chat list
- `/chat/:id` - Chat conversation
- `/user/:id` - View user profile

## Building for Production

1. **Build frontend:**
   ```bash
   make frontend-build
   ```

2. **Build backend:**
   ```bash
   make build
   ```

3. **Run:**
   ```bash
   ./matcha
   ```

## Environment Variables

Create a `.env` file:
```
PORT=8080
DB_PATH=data/matcha.db
SMTP_HOST=mailhog
SMTP_PORT=1025
```

## Next Steps

1. Implement authentication (JWT tokens or sessions)
2. Connect API endpoints to database
3. Add real-time features (WebSocket/SSE)
4. Style with HeroUI components
5. Add image upload functionality

