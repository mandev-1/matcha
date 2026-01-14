# Quick Start Guide

## Current Status

✅ **Working**:
- Go backend server structure
- Next.js frontend with HeroUI
- Database schema
- API route definitions
- Login/Register pages created
- Development workflow configured

⚠️ **Needs Work**:
- Most backend handlers are TODO stubs
- No authentication implementation
- Missing core pages (profile, browse, chat, etc.)
- Legacy code needs cleanup

## Immediate Next Steps

### 1. Install Dependencies
```bash
cd static/heroUi
npm install --legacy-peer-deps
```

### 2. Clean Up Legacy Code
```bash
# From project root
rm -rf handlers/          # Old duplicate handlers
rm -rf static/web/       # Old Vite setup  
rm -rf static/dist/      # Old build output
rm -rf static/heroUi/app/about/
rm -rf static/heroUi/app/blog/
rm -rf static/heroUi/app/docs/
rm -rf static/heroUi/app/pricing/
```

### 3. Start Development

**Terminal 1 - Backend**:
```bash
make run
# Server runs on http://localhost:8080
```

**Terminal 2 - Frontend**:
```bash
make frontend-dev
# Dev server runs on http://localhost:3000
# Visit: http://localhost:3000
```

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Next.js Frontend (Port 3000)      │
│   - Pages: /login, /register, etc.  │
│   - Proxies /api/* → Go server      │
└──────────────┬──────────────────────┘
               │ HTTP (proxied)
               ▼
┌─────────────────────────────────────┐
│   Go/Goji Backend (Port 8080)       │
│   - API Routes: /api/login, etc.     │
│   - Database: SQLite                 │
└─────────────────────────────────────┘
```

## File Structure

```
matcha/
├── cmd/server/           # Go entry point
├── internal/
│   ├── handlers/        # API handlers (TODO: implement)
│   ├── models/          # Data models ✅
│   ├── database/        # DB connection ✅
│   └── config/          # Configuration ✅
├── static/heroUi/       # Next.js frontend
│   ├── app/             # Pages
│   │   ├── login/      # ✅ Done
│   │   ├── register/   # ✅ Done
│   │   └── ...         # TODO: profile, browse, chat, etc.
│   └── components/      # React components
└── migrations/          # DB schema ✅
```

## What to Build Next

**Priority 1: Authentication** (Critical)
- Password hashing
- Session/JWT management
- Protected routes

**Priority 2: Profile Page**
- View own profile
- Edit profile
- Upload pictures
- Manage tags

**Priority 3: Browse Page**
- List suggested profiles
- Matching algorithm
- Like/unlike functionality

**Priority 4: Chat**
- Chat list
- Individual chats
- Real-time messaging

See `docs/BUILD_PLAN.md` for detailed build order.

