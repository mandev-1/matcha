# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files and npm config
COPY web/package.json web/package-lock.json* ./
COPY web/.npmrc* ./

# Install frontend dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy frontend source
COPY web/ ./

# Create static directory for build output
RUN mkdir -p ../static/dist

# Build frontend (outputs to ../static/dist relative to frontend dir)
RUN npm run build && ls -la ../static/dist || (echo "Build failed or no output" && exit 1)

# Stage 2: Build backend
FROM golang:1.23 AS backend-builder

# Install build dependencies for CGO (required for sqlite3)
RUN apt-get update && apt-get install -y \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Copy built frontend from previous stage
# Vite outputs to ../static/dist (relative to frontend dir)
COPY --from=frontend-builder /app/static/dist ./static/dist

# Build the application (from cmd/server)
RUN CGO_ENABLED=1 GOOS=linux go build -o matcha ./cmd/server

# Stage 3: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=backend-builder /app/matcha .

# Copy static files (including built frontend)
COPY --from=backend-builder /app/static ./static

# Create data directory structure
RUN mkdir -p data/uploads

EXPOSE 8080

CMD ["./matcha"]

