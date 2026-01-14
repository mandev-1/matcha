# Build Plan - Matcha Dating App

## Quick Start Checklist

### ✅ Already Done
- [x] Project structure set up
- [x] Database schema created
- [x] Go backend with API routes
- [x] Next.js frontend with HeroUI
- [x] Login/Register pages created
- [x] API proxy configured
- [x] Development workflow set up

### 🔧 Immediate Fixes Needed

1. **Install Frontend Dependencies**:
   ```bash
   cd static/heroUi
   npm install --legacy-peer-deps
   ```

2. **Clean Up Legacy Code**:
   ```bash
   # Remove old handlers (duplicate)
   rm -rf handlers/
   
   # Remove old Vite setup
   rm -rf static/web/
   rm -rf static/dist/
   ```

3. **Remove Template Pages**:
   ```bash
   rm -rf static/heroUi/app/about/
   rm -rf static/heroUi/app/blog/
   rm -rf static/heroUi/app/docs/
   rm -rf static/heroUi/app/pricing/
   ```

## Build Order (Recommended)

### Phase 1: Authentication (Week 1) 🔐

**Backend Tasks**:
1. Add password hashing (`golang.org/x/crypto/bcrypt`)
2. Implement JWT tokens or sessions
3. Create middleware for protected routes
4. Implement email verification (MailHog)
5. Add password reset functionality

**Frontend Tasks**:
1. Create auth context/state management
2. Store auth token (localStorage or cookies)
3. Create protected route wrapper
4. Update login/register error handling
5. Add logout functionality

**Files to Create/Update**:
- `internal/handlers/auth.go` - Implement actual auth logic
- `internal/middleware/auth.go` - Auth middleware
- `static/heroUi/contexts/AuthContext.tsx` - Auth state
- `static/heroUi/components/ProtectedRoute.tsx` - Route guard

### Phase 2: Profile Management (Week 1-2) 👤

**Backend Tasks**:
1. Implement profile CRUD operations
2. Add image upload endpoint
3. Implement tag management
4. Calculate fame rating
5. Track profile views

**Frontend Tasks**:
1. Create profile page (`app/profile/page.tsx`)
2. Profile edit form
3. Image upload component
4. Tag input component
5. View "who liked/viewed you" page

**Files to Create**:
- `app/profile/page.tsx`
- `app/profile/edit/page.tsx`
- `components/ImageUpload.tsx`
- `components/TagInput.tsx`

### Phase 3: Browsing & Matching (Week 2) 🔍

**Backend Tasks**:
1. Implement matching algorithm:
   - Gender/sexual preference filtering
   - Location-based matching
   - Tag-based matching
   - Fame rating calculation
2. Add sorting (age, location, fame, tags)
3. Add filtering (age range, location, fame, tags)

**Frontend Tasks**:
1. Create browse page (`app/browse/page.tsx`)
2. Profile card component
3. Filter sidebar
4. Sort dropdown
5. Like/unlike buttons

**Files to Create**:
- `app/browse/page.tsx`
- `components/ProfileCard.tsx`
- `components/FilterSidebar.tsx`

### Phase 4: User Profile View (Week 2) 👁️

**Backend Tasks**:
1. Implement user profile view endpoint
2. Track profile views
3. Check like/connection status
4. Implement block/report functionality

**Frontend Tasks**:
1. Create user profile page (`app/user/[id]/page.tsx`)
2. Profile display component
3. Like/unlike/block buttons
4. Picture gallery

**Files to Create**:
- `app/user/[id]/page.tsx`
- `components/UserProfile.tsx`
- `components/PictureGallery.tsx`

### Phase 5: Search (Week 3) 🔎

**Backend Tasks**:
1. Implement advanced search endpoint
2. Support multiple search criteria
3. Apply same filtering/sorting as browse

**Frontend Tasks**:
1. Create search page (`app/search/page.tsx`)
2. Advanced search form
3. Search results display

**Files to Create**:
- `app/search/page.tsx`
- `components/SearchForm.tsx`

### Phase 6: Chat (Week 3) 💬

**Backend Tasks**:
1. Implement message storage
2. Add WebSocket/SSE for real-time
3. Implement unread message tracking
4. Add message notifications

**Frontend Tasks**:
1. Create chat list page (`app/chat/page.tsx`)
2. Create individual chat page (`app/chat/[id]/page.tsx`)
3. Real-time message component
4. Message input component

**Files to Create**:
- `app/chat/page.tsx`
- `app/chat/[id]/page.tsx`
- `components/ChatList.tsx`
- `components/MessageInput.tsx`
- `components/MessageBubble.tsx`

### Phase 7: Notifications (Week 3-4) 🔔

**Backend Tasks**:
1. Implement notification system
2. Real-time notification delivery
3. Mark as read functionality

**Frontend Tasks**:
1. Notification bell component
2. Notification dropdown
3. Real-time notification updates

**Files to Create**:
- `components/NotificationBell.tsx`
- `components/NotificationDropdown.tsx`

### Phase 8: Polish & Security (Week 4) ✨

**Tasks**:
1. Add GPS location functionality
2. Implement file upload validation
3. Security audit:
   - SQL injection prevention
   - XSS protection
   - CSRF protection
   - Input validation
4. Error handling improvements
5. Loading states
6. Mobile responsiveness
7. Generate 500+ test profiles

## File Structure to Build

```
static/heroUi/app/
├── page.tsx              # Home/landing page
├── login/
│   └── page.tsx          # ✅ Done
├── register/
│   └── page.tsx         # ✅ Done
├── profile/
│   ├── page.tsx         # View own profile
│   └── edit/
│       └── page.tsx     # Edit profile
├── browse/
│   └── page.tsx         # Browse suggested profiles
├── search/
│   └── page.tsx         # Advanced search
├── chat/
│   ├── page.tsx         # Chat list
│   └── [id]/
│       └── page.tsx     # Individual chat
└── user/
    └── [id]/
        └── page.tsx     # View other user's profile

static/heroUi/components/
├── ProfileCard.tsx       # Profile card for browse/search
├── ImageUpload.tsx       # Image upload component
├── TagInput.tsx         # Tag input component
├── ChatList.tsx         # Chat list component
├── MessageInput.tsx     # Message input
├── MessageBubble.tsx    # Individual message
├── NotificationBell.tsx # Notification icon
├── ProtectedRoute.tsx   # Route guard
└── ... (other components)

static/heroUi/contexts/
└── AuthContext.tsx      # Authentication state
```

## Dependencies to Add

### Backend (Go)
```go
// Add to go.mod
golang.org/x/crypto/bcrypt  // Password hashing
github.com/golang-jwt/jwt/v5 // JWT tokens (optional)
```

### Frontend (Already in package.json)
- ✅ All HeroUI components
- ✅ @iconify/react (needs installation)
- ✅ next/navigation (built-in)

## Development Commands

```bash
# Backend
make run              # Start Go server (:8080)

# Frontend
make frontend-dev     # Start Next.js dev server (:3000)
make frontend-install # Install dependencies
make frontend-build   # Build for production

# Database
make init-db          # Initialize database

# Docker
make docker-up-build  # Build and run everything
```

## Next Immediate Steps

1. **Install dependencies**:
   ```bash
   cd static/heroUi && npm install --legacy-peer-deps
   ```

2. **Clean up**:
   - Remove `handlers/` directory
   - Remove template pages
   - Update `.gitignore`

3. **Start with authentication**:
   - Add bcrypt to Go
   - Implement password hashing
   - Add JWT or session management
   - Create auth context in frontend

4. **Create home page**:
   - Update `app/page.tsx` to be a proper landing page
   - Add redirect logic for logged-in users

## Testing Strategy

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test full user flows
4. **Security Tests**: Test for vulnerabilities
5. **Load Tests**: Test with 500+ profiles

## Security Checklist

- [ ] Passwords hashed with bcrypt
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection
- [ ] File upload validation
- [ ] Input validation on all forms
- [ ] Authentication on protected routes
- [ ] Rate limiting (optional but recommended)

