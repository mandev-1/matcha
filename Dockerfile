# Multi-stage build for Matcha application
# Stage 1: Build Next.js frontend as standalone
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files first for better caching
COPY static/heroUi/package.json static/heroUi/package-lock.json* ./static/heroUi/

# Install frontend dependencies
WORKDIR /app/static/heroUi
RUN npm ci || npm install

# Copy all frontend source files (this invalidates cache if source changes)
WORKDIR /app
COPY static/heroUi ./static/heroUi

# Build Next.js as standalone
WORKDIR /app/static/heroUi
ENV NODE_ENV=production
ENV DOCKER_ENV=true
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
# Verify key files and directories exist
RUN test -f tsconfig.json && \
    test -d components && \
    test -d contexts && \
    test -f components/LocationMap.tsx && \
    test -f contexts/AuthContext.tsx && \
    echo "Files verified successfully"
# Build (ESLint is ignored during builds per next.config.js)
RUN npm run build

# Stage 2: Build Go backend
FROM golang:1.23-alpine AS backend-builder

# Install build dependencies for CGO (required for sqlite3)
RUN apk add --no-cache \
    gcc \
    musl-dev \
    sqlite-dev \
    git

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go application with CGO flags for Alpine/musl compatibility
# Define _LARGEFILE64_SOURCE and _GNU_SOURCE for off64_t support
RUN CGO_ENABLED=1 GOOS=linux \
    CGO_CFLAGS="-D_LARGEFILE64_SOURCE -D_GNU_SOURCE" \
    go build -o matcha ./cmd/server

# Build the generate-users tool
RUN CGO_ENABLED=1 GOOS=linux \
    CGO_CFLAGS="-D_LARGEFILE64_SOURCE -D_GNU_SOURCE" \
    go build -o matcha-generate-users ./cmd/generate-users

# Stage 3: Runtime
FROM node:18-alpine

# Install runtime dependencies (Node.js already included, add SQLite, curl, Python, and Pillow)
RUN apk add --no-cache \
    ca-certificates \
    sqlite \
    curl \
    bash \
    python3 \
    py3-pip \
    && pip3 install --break-system-packages --no-cache-dir Pillow>=9.0.0

WORKDIR /app

# Copy Go binaries
COPY --from=backend-builder /app/matcha .
COPY --from=backend-builder /app/matcha-generate-users .

# Copy Next.js standalone build
# Next.js standalone outputs to .next/standalone/static/heroUi/
# We need to copy the entire standalone structure
COPY --from=frontend-builder /app/static/heroUi/.next/standalone ./
# Copy static files to .next/static (Next.js expects them relative to server.js location)
COPY --from=frontend-builder /app/static/heroUi/.next/static ./.next/static
# Copy public assets (standalone includes them, but ensure they're accessible)
COPY --from=frontend-builder /app/static/heroUi/public ./public

# Copy migrations and scripts
COPY migrations ./migrations
COPY scripts ./scripts

# Create necessary directories
RUN mkdir -p data uploads

# Expose ports (Next.js on 3000, Go API on 8080)
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start script that runs migrations then starts both servers
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
