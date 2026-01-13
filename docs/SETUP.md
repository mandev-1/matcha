# Matcha Setup Guide

## Prerequisites

- Go 1.21 or higher
- Docker and Docker Compose (for containerized setup)
- SQLite3 (for local development)
- Hero template engine (for compiling templates)

## Installing Hero Template Engine

The Hero template engine is a Go tool that compiles HTML templates to Go code. Install it with:

```bash
go install github.com/shiyanhui/hero@latest
```

**Note:** Make sure `$GOPATH/bin` or `$HOME/go/bin` is in your `$PATH` so you can run the `hero` command.

If you encounter TLS/certificate issues, you can try:
1. Setting `GOPROXY=direct` temporarily
2. Or downloading the binary directly from the GitHub releases

Verify installation:
```bash
hero --version
```

## Local Development Setup

1. **Install Dependencies**

   ```bash
   go mod tidy
   ```

2. **Initialize Database**

   ```bash
   mkdir -p data
   sqlite3 data/matcha.db < database/schema.sql
   ```

   Or use the Makefile:
   ```bash
   make init-db
   ```

3. **Set Up Environment Variables**

   Copy `.env.example` to `.env` and adjust as needed:
   ```bash
   cp .env.example .env
   ```

4. **Run the Application**

   ```bash
   go run main.go
   ```

   Or use the Makefile:
   ```bash
   make run
   ```

   The server will start on `http://localhost:8080`

## Docker Setup

1. **Build and Run with Docker Compose**

   ```bash
   docker-compose up --build
   ```

   Or use the Makefile:
   ```bash
   make docker-build
   make docker-up
   ```

2. **Access the Application**

   - Application: `http://localhost:8080`
   - MailHog UI: `http://localhost:8025`

## Installing Hero Template Engine

**Important:** Hero is a Go template engine (github.com/shiyanhui/hero) that compiles HTML templates to Go code. It's different from the React Hero UI library.

### Installation Methods

**Method 1: Using the install script**
```bash
./install-hero.sh
```

**Method 2: Using Make**
```bash
make install-hero
```

**Method 3: Manual installation**
```bash
go install github.com/shiyanhui/hero/hero@latest
```

If you encounter TLS/certificate errors, try:
```bash
GOPROXY=direct go install github.com/shiyanhui/hero/hero@latest
```

**Method 4: Clone and build manually** (if above methods fail)
```bash
git clone https://github.com/shiyanhui/hero.git
cd hero/hero
go install
cd ../..
rm -rf hero
```

**Verify installation:**
```bash
hero --version
```

**Note:** Make sure `$HOME/go/bin` (or `$GOPATH/bin`) is in your `$PATH`. You can add it with:
```bash
export PATH=$PATH:$HOME/go/bin
```

## Hero Template Generation

After installing hero, generate Go code from HTML templates:

```bash
hero -source=./templates -dest=./templates
```

Or use the Makefile:
```bash
make hero
```

This will generate Go code from your HTML templates in the `templates` directory.

## Project Structure

```
matcha/
├── main.go              # Application entry point
├── config/              # Configuration management
├── database/            # Database setup and schema
├── handlers/            # HTTP request handlers
│   ├── routes.go       # Route definitions
│   ├── auth.go         # Authentication handlers
│   ├── profile.go      # Profile handlers
│   ├── browse.go       # Browse/search handlers
│   ├── interactions.go # Like/unlike handlers
│   ├── chat.go         # Chat handlers
│   └── api.go          # API endpoints
├── models/              # Data models
├── templates/           # Hero UI templates (HTML)
├── static/             # Static files (CSS, JS, images)
│   ├── css/
│   └── js/
└── data/               # Database and uploads (gitignored)
```

## Next Steps

1. Implement authentication (session management)
2. Set up email verification with MailHog
3. Implement user profile creation and editing
4. Build the matching algorithm
5. Implement real-time chat (WebSocket/SSE)
6. Add notification system
7. Integrate Hero UI components for better styling

## Development Notes

- The database schema is defined in `database/schema.sql`
- Static files are served from the `static/` directory
- Templates use Hero UI for server-side rendering
- Real-time features will use WebSocket or Server-Sent Events (SSE)


