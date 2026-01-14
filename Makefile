.PHONY: build run test clean hero docker-build docker-up docker-down frontend-install frontend-build frontend-dev

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
	docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog || docker start mailhog

# Stop MailHog
mailhog-stop:
	docker stop mailhog || true
	docker rm mailhog || true


