# Next.js + Go Integration Setup

This project now uses Next.js (TypeScript) as the frontend with Go/Goji as the API backend.

## Project Structure

```
matcha/
├── cmd/server/          # Go server entry point
├── internal/            # Go backend code
│   ├── handlers/        # API endpoints
│   ├── models/          # Data models
│   └── ...
├── my-heroui-app/       # Next.js frontend (TypeScript)
│   ├── app/             # Next.js app directory
│   │   ├── login/       # Login page
│   │   ├── register/    # Register page
│   │   └── ...
│   ├── components/      # React components
│   └── ...
└── ...
```

## Development Workflow

### 1. Start Go API Server
```bash
make run
# or
go run ./cmd/server/main.go
```
Runs on `http://localhost:8080`

### 2. Start Next.js Dev Server
```bash
cd my-heroui-app
npm run dev
# or from root:
make frontend-dev
```
Runs on `http://localhost:3000`

### 3. Access the App
- Frontend: `http://localhost:3000`
- API: `http://localhost:8080/api/*`

## How It Works

### Development Mode
- Next.js dev server runs on port 3000
- Go server runs on port 8080
- Next.js proxies `/api/*` requests to `http://localhost:8080/api/*` (configured in `next.config.js`)

### Production Mode
- Next.js builds to standalone output
- Go server serves the Next.js static files
- Everything runs on port 8080

## API Integration

All API calls from the Next.js app use relative paths:
```typescript
fetch('/api/login', { ... })  // Proxied to localhost:8080/api/login in dev
```

## Pages Created

- `/login` - Login page
- `/register` - Registration page

## Next Steps

1. Create other pages (Profile, Browse, Chat, etc.)
2. Set up authentication context/state management
3. Update Dockerfile for Next.js standalone build
4. Configure Go server to serve Next.js production build

