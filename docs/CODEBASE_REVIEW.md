# Codebase Review & Build Plan

## Current Architecture

### Backend (Go/Goji)
- **Location**: `cmd/server/main.go` + `internal/`
- **Framework**: Goji (micro-framework)
- **Database**: SQLite (`data/matcha.db`)
- **Port**: 8080 (configurable via PORT env var)

### Frontend (Next.js/TypeScript)
- **Location**: `static/heroUi/`
- **Framework**: Next.js 15 with App Router
- **UI Library**: HeroUI v2
- **Port**: 3000 (dev server)
- **Build Output**: Standalone (for production)

## Current Structure

```
matcha/
├── cmd/server/          # Go server entry point ✅
├── internal/            # Go backend code ✅
│   ├── config/         # Configuration ✅
│   ├── database/       # DB connection ✅
│   ├── handlers/       # API handlers (mostly TODO) ⚠️
│   └── models/         # Data models ✅
├── static/heroUi/      # Next.js frontend ✅
│   ├── app/            # Next.js pages
│   │   ├── login/      # ✅ Created
│   │   ├── register/   # ✅ Created
│   │   └── ...         # ⚠️ Template pages (about, blog, docs, pricing)
│   └── components/     # React components
├── migrations/          # DB schema ✅
├── data/               # Runtime data (gitignored) ✅
└── docs/               # Documentation ✅
```

## Issues Found

### 1. Legacy Code
- ❌ `handlers/index.go` at root - should be removed (duplicate of `internal/handlers/`)
- ⚠️ `static/web/` - old Vite setup, can be removed
- ⚠️ `static/dist/` - old build output, not needed for Next.js

### 2. Frontend Routes (Go)
- ⚠️ `SetupFrontendRoutes` in `api_routes.go` is for old Vite build
- ✅ In dev: Next.js handles all frontend routing
- ⚠️ In production: Need to update to serve Next.js standalone build

### 3. Template Pages
- ⚠️ `app/about/`, `app/blog/`, `app/docs/`, `app/pricing/` are template pages
- ✅ Should be replaced with: `profile/`, `browse/`, `chat/`, `user/[id]/`

### 4. Missing Pages
- ❌ `/profile` - User profile page
- ❌ `/browse` - Browse suggested profiles
- ❌ `/search` - Advanced search
- ❌ `/chat` - Chat list
- ❌ `/chat/[id]` - Individual chat
- ❌ `/user/[id]` - View other user's profile

### 5. Backend Implementation
- ⚠️ Most handlers are TODO stubs
- ⚠️ No authentication/session management
- ⚠️ No password hashing
- ⚠️ No email sending
- ⚠️ No real-time features (WebSocket/SSE)

## What's Working ✅

1. **Project Structure**: Clean Go project structure
2. **Database Schema**: Complete schema with all required tables
3. **API Routes**: All routes defined in `api_routes.go`
4. **Models**: All data models defined
5. **Frontend Setup**: Next.js configured with API proxy
6. **Login/Register Pages**: Created and styled
7. **Configuration**: Environment-based config system
8. **Makefile**: Development commands set up

## Build Plan

### Phase 1: Cleanup & Setup (Do First)

1. **Remove legacy code**:
   ```bash
   rm -rf handlers/          # Old handlers (use internal/handlers)
   rm -rf static/web/       # Old Vite setup
   rm -rf static/dist/      # Old build output
   ```

2. **Clean up template pages**:
   ```bash
   rm -rf static/heroUi/app/about/
   rm -rf static/heroUi/app/blog/
   rm -rf static/heroUi/app/docs/
   rm -rf static/heroUi/app/pricing/
   ```

3. **Update .gitignore**:
   - Add `static/heroUi/.next/`
   - Add `static/heroUi/standalone/`

### Phase 2: Authentication (Critical - Do Next)

**Backend (`internal/handlers/auth.go`)**:
1. ✅ Password hashing (use `golang.org/x/crypto/bcrypt`)
2. ✅ Session management (JWT tokens or sessions)
3. ✅ Email verification (send via MailHog)
4. ✅ Password reset functionality
5. ✅ Middleware for protected routes

**Frontend**:
1. Create auth context/state management
2. Store token in localStorage/cookies
3. Protected route wrapper
4. Update login/register to handle errors properly

### Phase 3: Core Pages (Build in Order)

1. **Home Page** (`app/page.tsx`)
   - Landing page for logged-out users
   - Redirect to `/browse` if logged in

2. **Profile Page** (`app/profile/page.tsx`)
   - View own profile
   - Edit profile form
   - Upload pictures (up to 5)
   - Manage tags/interests
   - View who liked/viewed you

3. **Browse Page** (`app/browse/page.tsx`)
   - List of suggested profiles
   - Filtering (age, location, fame, tags)
   - Sorting options
   - Like/unlike functionality

4. **Search Page** (`app/search/page.tsx`)
   - Advanced search form
   - Search results
   - Same filtering as browse

5. **User Profile** (`app/user/[id]/page.tsx`)
   - View other user's profile
   - Like/unlike button
   - Block/report buttons
   - See if connected

6. **Chat Pages**:
   - `app/chat/page.tsx` - Chat list
   - `app/chat/[id]/page.tsx` - Individual chat

### Phase 4: Backend Implementation

**Priority Order**:
1. **Auth** (`auth.go`) - Password hashing, sessions, email
2. **Profile** (`profile.go`) - CRUD operations
3. **Browse** (`browse.go`) - Matching algorithm
4. **Interactions** (`interactions.go`) - Like/unlike, views
5. **Chat** (`chat.go`) - Messages, real-time
6. **Notifications** (`api.go`) - Real-time notifications

### Phase 5: Real-time Features

1. **WebSocket/SSE Setup** for:
   - Chat messages
   - Notifications
   - Online status

2. **Notification System**:
   - Like notifications
   - View notifications
   - Message notifications
   - Match notifications

### Phase 6: Advanced Features

1. **Matching Algorithm**:
   - Location-based matching
   - Tag-based matching
   - Fame rating calculation

2. **File Uploads**:
   - Image upload endpoint
   - Image validation
   - Storage in `data/uploads/`

3. **GPS Location**:
   - Browser geolocation API
   - Manual location fallback

## Recommended Build Order

### Week 1: Foundation
1. Cleanup legacy code
2. Implement authentication (backend + frontend)
3. Create home page
4. Create profile page (view + edit)

### Week 2: Core Features
1. Implement browse page
2. Implement matching algorithm
3. Create user profile view page
4. Implement like/unlike

### Week 3: Communication
1. Implement chat list
2. Implement individual chat
3. Add real-time messaging
4. Add notifications

### Week 4: Polish & Security
1. Add file uploads
2. Implement GPS location
3. Add search functionality
4. Security audit
5. Testing with 500+ profiles

## Next Steps (Start Here)

1. **Install dependencies**:
   ```bash
   cd static/heroUi
   npm install --legacy-peer-deps
   ```

2. **Clean up**:
   - Remove legacy handlers/
   - Remove template pages
   - Update .gitignore

3. **Start with Authentication**:
   - Implement password hashing
   - Add JWT or session management
   - Update login/register handlers

4. **Create first real page**:
   - Update home page (`app/page.tsx`)
   - Create profile page structure

## Development Workflow

**Terminal 1 - Backend**:
```bash
make run
# Runs Go server on :8080
```

**Terminal 2 - Frontend**:
```bash
make frontend-dev
# Runs Next.js on :3000 with hot reload
```

**Access**: `http://localhost:3000` (Next.js proxies `/api/*` to Go server)

