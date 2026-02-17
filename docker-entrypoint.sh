#!/bin/sh
set -e

echo "Starting Matcha application..."

# Ensure data directory exists
mkdir -p data

# Run migrations if database doesn't exist or migrations are available
if [ ! -f "data/matcha.db" ] || [ -n "$(ls -A migrations/*.sql 2>/dev/null)" ]; then
  echo "Running database migrations..."
  
  # Create database if it doesn't exist
  if [ ! -f "data/matcha.db" ]; then
    echo "Creating database..."
    sqlite3 data/matcha.db < migrations/schema.sql || true
  fi
  
  # Run migrations (idempotent - safe to run multiple times)
  sqlite3 data/matcha.db < migrations/add_username_and_verification.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_is_setup.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_personality_fields.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_location_updated_at.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_is_bot.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_blocks_and_reports.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_notifications_related_user_id.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/add_bot_activity_log.sql 2>/dev/null || true
  sqlite3 data/matcha.db < migrations/remove_set_up_column.sql 2>/dev/null || true
  
  echo "Migrations complete."
fi

# Check if bot users exist, if not generate 500 bot users with placeholder images
BOT_COUNT=$(sqlite3 data/matcha.db "SELECT COUNT(*) FROM users WHERE is_bot = 1;" 2>/dev/null || echo "0")
if [ "$BOT_COUNT" -eq "0" ]; then
  echo "No bot users found. Generating 500 bot users with placeholder images..."
  # Ensure data/extracted_images directory exists
  mkdir -p data/extracted_images
  # Generate placeholder image if it doesn't exist
  if [ ! -f "data/extracted_images/placeholder_bot.jpg" ]; then
    echo "Generating placeholder bot image..."
    python3 scripts/generate_bot_placeholder.py -o data/extracted_images/placeholder_bot.jpg || \
    python scripts/generate_bot_placeholder.py -o data/extracted_images/placeholder_bot.jpg || \
    echo "Warning: Could not generate placeholder image. Users will be created without images."
  fi
  # Run user generation
  ./matcha-generate-users || echo "Warning: User generation failed. Continuing anyway..."
else
  echo "Found $BOT_COUNT bot users in database."
fi

# Start Go backend server in background
echo "Starting Go backend server on port 8080..."
./matcha &
GO_PID=$!

# Start Next.js standalone server
echo "Starting Next.js server on port 3000..."
# Next.js standalone server.js is at the root of standalone directory
# The structure is: /app/static/heroUi/.next/standalone/static/heroUi/server.js
# But we copied standalone to /app, so server.js should be at /app/static/heroUi/server.js
if [ -f "static/heroUi/server.js" ]; then
  cd static/heroUi
  PORT=3000 NODE_ENV=production DOCKER_ENV=true node server.js &
elif [ -f "server.js" ]; then
  PORT=3000 NODE_ENV=production DOCKER_ENV=true node server.js &
else
  echo "ERROR: Next.js server.js not found. Available files:"
  find . -name "server.js" -type f 2>/dev/null || echo "No server.js found"
  exit 1
fi
NEXTJS_PID=$!

# Function to handle shutdown
cleanup() {
  echo "Shutting down..."
  kill $GO_PID $NEXTJS_PID 2>/dev/null || true
  wait $GO_PID $NEXTJS_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for either process to exit
wait $GO_PID $NEXTJS_PID
