.PHONY: build run test clean hero docker-build docker-up docker-down frontend-install frontend-build frontend-dev bot-simulator bot-simulator-custom mailhog mailhog-stop mailhog-ports mailhog-kill-ports init-db migrate-notifications

# Build the application
build:
	go build -o matcha ./cmd/server

# Run the application
run:
	go run ./cmd/server/main.go

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -f matcha
	rm -rf data/*.db

# Helper scripts
install-hero:
	@./scripts/install-hero.sh

fix-deps:
	@./scripts/fix-deps.sh

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-up-build:
	docker-compose up --build

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app

# Initialize database
init-db:
	mkdir -p data
	sqlite3 data/matcha.db < migrations/schema.sql

# Add related_user_id to notifications (run once if you see "table notifications has no column named related_user_id")
migrate-notifications:
	@mkdir -p data
	@sqlite3 data/matcha.db < migrations/add_notifications_related_user_id.sql
	@echo "Migration applied: notifications.related_user_id"

# Frontend commands (Next.js)
frontend-install:
	cd static/heroUi && npm install

frontend-build:
	cd static/heroUi && npm run build

frontend-dev:
	cd static/heroUi && npm run dev

# Build everything (backend + frontend)
build-all: frontend-build build

# Run in development mode (backend + frontend)
dev: frontend-dev

# Start MailHog for local development
mailhog:
	@echo "Checking for existing MailHog container..."
	@docker stop mailhog 2>/dev/null || true
	@docker rm mailhog 2>/dev/null || true
	@echo "Checking if ports 1025 or 8025 are in use..."
	@if lsof -ti:1025 >/dev/null 2>&1; then \
		echo "Port 1025 is in use. Run 'make mailhog-ports' to see what's using it, or 'make mailhog-kill-ports' to free it."; \
		exit 1; \
	fi
	@if lsof -ti:8025 >/dev/null 2>&1; then \
		echo "Port 8025 is in use. Run 'make mailhog-ports' to see what's using it, or 'make mailhog-kill-ports' to free it."; \
		exit 1; \
	fi
	@echo "Starting MailHog..."
	@docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog && \
		echo "MailHog started successfully! Web UI: http://localhost:8025" || \
		(echo "Failed to start MailHog. Check if Docker is running and ports are available."; exit 1)

# Start MailHog for local development
mailhog-podman:
	@podman stop mailhog 2>/dev/null || true
	@podman rm mailhog 2>/dev/null || true
	@podman run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog || \
		(echo "Failed to start MailHog. Port may be in use or Podman may not be running.")

# Stop MailHog
mailhog-stop:
	@echo "Stopping MailHog..."
	@docker stop mailhog 2>/dev/null || true
	@docker rm mailhog 2>/dev/null || true
	@echo "MailHog stopped."

# Show what's using MailHog ports
mailhog-ports:
	@echo "Checking ports 1025 and 8025..."
	@lsof -i:1025 2>/dev/null || echo "Port 1025 is free"
	@lsof -i:8025 2>/dev/null || echo "Port 8025 is free"

# Kill processes using MailHog ports (use with caution)
mailhog-kill-ports:
	@echo "Killing processes on ports 1025 and 8025..."
	@lsof -ti:1025 | xargs kill -9 2>/dev/null || echo "No process on port 1025"
	@lsof -ti:8025 | xargs kill -9 2>/dev/null || echo "No process on port 8025"
	@echo "Ports cleared."

# Stop MailHog (Podman)
mailhog-stop-podman:
	podman stop mailhog || true
	podman rm mailhog || true

# Generate test users
500:
	@echo "Running migration to add is_bot column..."
	@sqlite3 data/matcha.db < migrations/add_is_bot.sql || true
	@echo "Generating 500 test users..."
	@go run ./cmd/generate-users/main.go

# Clean up test users
clean-500:
	@echo "Cleaning up test users..."
	@go run ./cmd/clean-users/main.go

# Run bot simulator
bot-simulator:
	@echo "Starting bot simulator..."
	@go run ./cmd/bot-simulator/main.go

# Run bot simulator with custom config
bot-simulator-custom:
	@echo "Starting bot simulator with custom config..."
	@go run ./cmd/bot-simulator/main.go -bots 20 -interval 15s -concurrency 10

# Run bot simulator with 150 bots
bot-simulator-150:
	@echo "Starting bot simulator with 150 bots..."
	@go run ./cmd/bot-simulator/main.go -bots 150 -interval 10s -concurrency 20
	