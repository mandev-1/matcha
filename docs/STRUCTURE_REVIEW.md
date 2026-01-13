# Directory Structure Review & Reorganization

## ✅ Reorganized to Standard Go Structure

The project has been reorganized to follow Go community best practices.

## New Structure

```
matcha/
├── cmd/
│   └── server/              # Main application entry point
│       └── main.go
├── internal/                # Private application code
│   ├── config/              # Configuration management
│   │   └── config.go
│   ├── database/            # Database setup
│   │   └── database.go
│   ├── handlers/            # HTTP handlers (API endpoints)
│   │   ├── api_helper.go
│   │   ├── api_routes.go
│   │   ├── auth.go
│   │   ├── profile.go
│   │   ├── browse.go
│   │   ├── chat.go
│   │   ├── interactions.go
│   │   └── ...
│   └── models/              # Data models
│       └── user.go
├── migrations/              # Database migrations
│   └── schema.sql
├── web/                     # Frontend (React + HeroUI)
│   ├── src/
│   │   ├── pages/
│   │   └── components/
│   └── package.json
├── static/                  # Static files served by Go
│   └── dist/                # Built React app
├── scripts/                 # Utility scripts
├── docs/                    # Documentation
├── data/                    # Runtime data (gitignored)
└── [config files]           # Dockerfile, docker-compose.yml, etc.
```

## Changes Made

### ✅ Moved to Standard Locations

1. **`main.go` → `cmd/server/main.go`**
   - Standard location for application entry points
   - Allows multiple binaries if needed later

2. **`handlers/` → `internal/handlers/`**
   - Private application code goes in `internal/`
   - Prevents external packages from importing

3. **`models/` → `internal/models/`**
   - Data models are application-specific
   - Should be private to the application

4. **`config/` → `internal/config/`**
   - Configuration is application-specific
   - Private implementation

5. **`database/` → `internal/database/`**
   - Database code is application-specific
   - Private implementation

6. **`frontend/` → `web/`**
   - More standard name for frontend directory
   - Common in Go projects

7. **`database/schema.sql` → `migrations/schema.sql`**
   - Standard location for database migrations
   - Better organization for future migrations

### ✅ Updated Imports

All imports have been updated:
- `matcha/config` → `matcha/internal/config`
- `matcha/database` → `matcha/internal/database`
- `matcha/handlers` → `matcha/internal/handlers`

### ✅ Updated Configuration

- **Dockerfile**: Updated paths for `web/` and `cmd/server/`
- **Makefile**: Updated all paths
- **.dockerignore**: Updated to exclude `web/` instead of `frontend/`

## Benefits

1. **Follows Go Standards**: Aligns with Go community conventions
2. **Better Encapsulation**: `internal/` prevents external imports
3. **Scalability**: Easy to add more binaries in `cmd/`
4. **Clarity**: Clear separation of public vs private code
5. **Professional**: Standard structure expected in Go projects

## Running the Application

Everything works the same, just with updated paths:

```bash
# Build
make build          # Builds from cmd/server/main.go

# Run
make run            # Runs cmd/server/main.go

# Frontend
make frontend-build  # Builds from web/
make frontend-dev    # Dev server from web/

# Docker
docker compose up --build  # Uses new structure
```

## Why `internal/`?

The `internal/` directory is a special Go convention. Code in `internal/` can only be imported by packages within the same parent directory. This prevents external packages from depending on your internal implementation details.

## Future Additions

With this structure, you can easily add:
- `cmd/cli/` - CLI tool
- `cmd/migrate/` - Migration tool
- `pkg/` - Public library code (if needed)
- `api/` - API definitions
- More migrations in `migrations/`
