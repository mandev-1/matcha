# Bot Simulator

A traffic simulation tool that makes bot accounts perform realistic actions on the Matcha platform.

## Overview

The bot simulator authenticates as bot users and performs various actions to simulate real user traffic:
- **Liking profiles** - Bots randomly like other users' profiles
- **Viewing profiles** - Bots browse and view profiles (generates view records)
- **Changing tags** - Bots add/remove tags from their profiles
- **Sending messages** - Bots send messages to users they're connected with
- **Staying online** - Bots periodically update their online status

## Usage

### Basic Usage

```bash
# Run with default settings (10 bots, 30s interval, 5 concurrent actions)
make bot-simulator

# Or run directly
go run ./cmd/bot-simulator/main.go
```

### Custom Configuration

```bash
# Run with custom settings
go run ./cmd/bot-simulator/main.go \
  -bots 20 \              # Number of bots to simulate
  -interval 15s \         # Interval between actions per bot
  -concurrency 10 \       # Number of concurrent actions
  -server http://localhost:8080 \  # Server URL
  -db ./data/matcha.db    # Database path
```

### Command Line Flags

- `-server` - Server URL (default: `http://localhost:8080`)
- `-db` - Database path (default: `./data/matcha.db`)
- `-bots` - Number of bots to simulate (default: `10`)
- `-interval` - Interval between actions per bot (default: `30s`)
- `-concurrency` - Number of concurrent bot actions (default: `5`)

## Prerequisites

1. **Bot accounts must exist** - Run `make 500` to generate bot users first
2. **Server must be running** - The bot simulator makes HTTP requests to the API
3. **Database must be accessible** - The simulator reads bot user data from the database

## How It Works

1. **Loads bot users** from the database (users with `is_bot = 1`)
2. **Authenticates each bot** using the default password (`test123`)
3. **Starts simulation** - Each bot runs in its own goroutine
4. **Performs random actions** at configured intervals:
   - 40% chance: Browse profiles
   - 20% chance: View a random profile
   - 25% chance: Like a random profile
   - 10% chance: Change tags
   - 5% chance: Send message (if connected)

5. **Updates online status** - Bots periodically access their profile to update `last_seen`

## Action Details

### Liking Profiles
- Bots browse profiles and randomly like them
- Skips their own profile
- Generates fame rating updates for both users

### Viewing Profiles
- Bots view random profiles
- Creates view records in the database
- Generates fame rating updates for viewed users

### Changing Tags
- Bots fetch popular tags
- Randomly add tags to their profile
- Helps simulate tag-based matching

### Sending Messages
- Bots check their connections
- Send messages to random connected users
- Only works if bot has mutual likes (connections)

### Online Status
- Bots access their profile every 2 minutes
- Updates `last_seen` timestamp
- Makes bots appear online

## Concurrency Control

The simulator uses a semaphore to limit concurrent actions, preventing server overload:
- Default: 5 concurrent actions
- Configurable via `-concurrency` flag
- Each bot action acquires the semaphore before executing

## Example Output

```
Starting bot simulator with 10 bots, interval: 30s, concurrency: 5
Loaded 10 bot users
Bot bot_Alex_Smith_1 (1) authenticated successfully
Bot bot_Jordan_Johnson_2 (2) authenticated successfully
...
Bot bot_Alex_Smith_1 liked profile 45
Bot bot_Jordan_Johnson_2 viewed profile 67
Bot bot_Taylor_Williams_3 added tag #travel
Bot bot_Morgan_Brown_4 sent message to user 23
```

## Best Practices

1. **Start with fewer bots** - Test with 5-10 bots first
2. **Adjust intervals** - Longer intervals (60s+) reduce server load
3. **Monitor server** - Watch server logs and metrics
4. **Use appropriate concurrency** - Don't exceed server capacity
5. **Run in background** - Use `nohup` or `screen` for long-running simulations

## Troubleshooting

### "No bot users found"
- Run `make 500` to generate bot accounts first
- Ensure database path is correct

### "Login failed"
- Verify bot accounts exist in database
- Check that default password is `test123`

### "Connection refused"
- Ensure server is running on the specified URL
- Check server port and firewall settings

### High server load
- Reduce number of bots (`-bots`)
- Increase action interval (`-interval`)
- Reduce concurrency (`-concurrency`)

## Integration with Development

The bot simulator is designed to work alongside the main server:
- Run server: `make run` (in one terminal)
- Run simulator: `make bot-simulator` (in another terminal)

This allows you to:
- Test the platform under load
- Generate realistic traffic patterns
- Observe system behavior with multiple users
- Test fame rating system with activity
- Verify matching algorithms with interactions
