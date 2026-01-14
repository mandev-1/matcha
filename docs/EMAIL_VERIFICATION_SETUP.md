# Email Verification & Runway Setup

## What's Been Implemented

### Backend Changes

1. **Database Schema Updates**:
   - Added `email_verification_token` field to users table
   - Added `set_up` field (default 0) to users table

2. **New Services**:
   - `internal/services/auth.go` - Password hashing, user creation, authentication
   - `internal/services/email.go` - Email sending via MailHog
   - `internal/services/jwt.go` - JWT token generation and validation

3. **Updated Handlers**:
   - `RegisterAPI` - Creates user with verification token, sends email via MailHog
   - `LoginAPI` - Authenticates user, checks email verification, returns `set_up` flag
   - `VerifyEmailAPI` - Verifies email using token

### Frontend Changes

1. **Updated Pages**:
   - `/register` - Now submits form and redirects to login after registration
   - `/login` - Checks `set_up` flag, redirects to `/runway` if false, otherwise `/profile`
   - `/verify-email` - New page for email verification
   - `/runway` - New page for profile setup (placeholder)

## Setup Instructions

### 1. Install Go Dependencies

```bash
go mod tidy
```

This will download:
- `golang.org/x/crypto/bcrypt` - Password hashing
- `github.com/golang-jwt/jwt/v5` - JWT tokens

### 2. Update Database Schema

If you have an existing database, you need to add the new columns:

```sql
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN set_up INTEGER DEFAULT 0;
```

Or recreate the database:
```bash
rm data/matcha.db
make init-db
```

### 3. Start MailHog

Make sure MailHog is running (via Docker Compose):
```bash
docker-compose up mailhog -d
```

Or manually:
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Access MailHog UI at: `http://localhost:8025`

### 4. Start the Application

**Backend**:
```bash
make run
```

**Frontend**:
```bash
make frontend-dev
```

## User Flow

1. **Registration**:
   - User fills out sign-up form
   - Backend creates user with `set_up = 0` and generates verification token
   - Email sent via MailHog with verification link
   - User redirected to login page

2. **Email Verification**:
   - User clicks link in email: `http://localhost:3000/verify-email?token=...`
   - Backend verifies token and sets `is_email_verified = 1`
   - User can now log in

3. **Login**:
   - User logs in with email/password
   - Backend checks email is verified
   - Returns JWT token and `set_up` flag
   - Frontend stores token in localStorage
   - If `set_up = 0`, redirects to `/runway`
   - If `set_up = 1`, redirects to `/profile`

4. **Profile Setup** (`/runway`):
   - User completes dating profile
   - Backend sets `set_up = 1` when profile is complete
   - User can now use the app

## API Endpoints

### POST /api/register
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /api/login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "set_up": false
    }
  }
}
```

### GET /api/verify-email?token=...
Verifies email using the token from the email link.

## Next Steps

1. **Complete `/runway` page** - Implement the full profile setup form according to project requirements:
   - Gender
   - Sexual preferences
   - Biography
   - Tags/interests
   - Pictures (up to 5)
   - Location/GPS

2. **Add API endpoint** to mark profile as complete:
   - `POST /api/profile/setup-complete` - Sets `set_up = 1`

3. **Add protected route middleware** - Check JWT token on protected routes

4. **Update JWT secret** - Change the hardcoded secret in `internal/services/jwt.go` to use environment variable

