#!/bin/sh
set -e

# Phase 2: Single entrypoint for Docker deployment.
# Idempotent: DB bootstrap only when missing, user gen only when < 542, bot sim starts once.

echo "Starting Matcha..."

mkdir -p data uploads

# --- 1. Database: bootstrap if missing, then run all migrations (same order as Makefile run-migrations) ---
if [ ! -f "data/matcha.db" ]; then
  echo "Creating database..."
  sqlite3 data/matcha.db < migrations/schema.sql
fi

echo "Running migrations..."
for m in migrations/schema.sql \
         migrations/add_username_and_verification.sql \
         migrations/add_is_setup.sql \
         migrations/add_personality_fields.sql \
         migrations/add_location_updated_at.sql \
         migrations/add_is_bot.sql \
         migrations/add_blocks_and_reports.sql \
         migrations/add_notifications_related_user_id.sql \
         migrations/add_bot_activity_log.sql \
         migrations/remove_set_up_column.sql; do
  [ -f "$m" ] && sqlite3 data/matcha.db < "$m" 2>/dev/null || true
done
# Password reset columns (idempotent: run each ALTER separately so "duplicate column" does not block others)
sqlite3 data/matcha.db "ALTER TABLE users ADD COLUMN password_reset_code TEXT;" 2>/dev/null || true
sqlite3 data/matcha.db "ALTER TABLE users ADD COLUMN password_reset_expires_at DATETIME;" 2>/dev/null || true
sqlite3 data/matcha.db "ALTER TABLE users ADD COLUMN password_reset_token TEXT;" 2>/dev/null || true
echo "Migrations complete."

# --- 2. Generate users only if bot count < 500 ---
BOT_COUNT=$(sqlite3 data/matcha.db "SELECT COUNT(*) FROM users WHERE is_bot = 1;" 2>/dev/null || echo "0")
if [ "$BOT_COUNT" -lt "500" ]; then
  echo "Generating users (found $BOT_COUNT bots, need 500)..."
  mkdir -p data/extracted_images
  if [ ! -f "data/extracted_images/placeholder_bot.jpg" ]; then
    python3 scripts/generate_bot_placeholder.py -o data/extracted_images/placeholder_bot.jpg 2>/dev/null || \
    python scripts/generate_bot_placeholder.py -o data/extracted_images/placeholder_bot.jpg 2>/dev/null || true
  fi
  ./matcha-generate-users 2>/dev/null || echo "Warning: User generation failed."
else
  echo "Found $BOT_COUNT bot users."
fi

# --- 3. Start Go backend ---
echo "Starting backend on :8080..."
./matcha &
GO_PID=$!

# --- 4. Start Next.js frontend ---
echo "Starting frontend on :3000..."
if [ -f "static/heroUi/server.js" ]; then
  (cd static/heroUi && PORT=3000 NODE_ENV=production DOCKER_ENV=true node server.js) &
elif [ -f "server.js" ]; then
  PORT=3000 NODE_ENV=production DOCKER_ENV=true node server.js &
else
  echo "ERROR: Next.js server.js not found. Run: find . -name server.js"
  exit 1
fi
NEXTJS_PID=$!

# --- 5. Start bot simulator (traffic simulation) ---
if [ -f "./matcha-bot-simulator" ]; then
  echo "Starting bot simulator..."
  ./matcha-bot-simulator -server http://localhost:8080 -db ./data/matcha.db -bots 20 -interval 15s -concurrency 10 &
  BOT_PID=$!
else
  BOT_PID=""
fi

cleanup() {
  echo "Shutting down..."
  kill $GO_PID $NEXTJS_PID 2>/dev/null || true
  [ -n "$BOT_PID" ] && kill $BOT_PID 2>/dev/null || true
  wait $GO_PID $NEXTJS_PID 2>/dev/null || true
  [ -n "$BOT_PID" ] && wait $BOT_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

wait $GO_PID $NEXTJS_PID
