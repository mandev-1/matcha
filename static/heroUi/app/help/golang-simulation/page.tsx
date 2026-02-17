"use client";

import React, { useState } from "react";
import MarkdownRenderer, { type Heading } from "@/components/MarkdownRenderer";
import ScrollSpy from "@/components/ScrollSpy";

const content = `# Simulating Activity with Bot Simulator

## Overview

The bot simulator is a traffic simulation tool that makes bot accounts perform realistic actions on the Matcha platform. This is useful for testing, development, and generating realistic traffic patterns.

## What It Does

The bot simulator authenticates as bot users and performs various actions:

- **Visiting profiles** - Bots visit and view user profiles (generates view records)
- **Liking profiles** - Bots like other users' profiles
- **Browsing profiles** - Bots browse the discovery feed
- **Changing tags** - Bots add/remove tags from their profiles
- **Sending messages** - Bots send messages to users they're connected with
- **Staying online** - Bots periodically update their online status

All bot activity is logged to the database and can be viewed in the [Bot Activity Log](/bot-activity) page.

## Quick Start

### Prerequisites

1. **Bot accounts must exist** - Run \`make 500\` to generate bot users first
2. **Server must be running** - The bot simulator makes HTTP requests to the API
3. **Database must be accessible** - The simulator reads bot user data from the database

### Basic Usage

\`\`\`bash
# Run with default settings (10 bots, 30s interval, 5 concurrent actions)
make bot-simulator

# Or run directly
go run ./cmd/bot-simulator/main.go
\`\`\`

### Custom Configuration

\`\`\`bash
# Run with custom settings
go run ./cmd/bot-simulator/main.go \\
  -bots 20 \\              # Number of bots to simulate
  -interval 15s \\         # Interval between actions per bot
  -concurrency 10 \\       # Number of concurrent actions
  -server http://localhost:8080 \\  # Server URL
  -db ./data/matcha.db    # Database path
\`\`\`

## Command Line Flags

| Flag | Description | Default |
|------|-------------|---------|
| \`-server\` | Server URL | \`http://localhost:8080\` |
| \`-db\` | Database path | \`./data/matcha.db\` |
| \`-bots\` | Number of bots to simulate | \`10\` |
| \`-interval\` | Interval between actions per bot | \`30s\` |
| \`-concurrency\` | Number of concurrent bot actions | \`5\` |

## How It Works

### Architecture

1. **Load Bots** - Reads bot users from the database (users with \`is_bot=1\`)
2. **Authenticate** - Each bot logs in and receives a JWT token
3. **Simulate Actions** - Bots perform random actions at specified intervals
4. **Concurrency Control** - A semaphore limits concurrent actions to prevent overload

## Bot Behavior Patterns

Each bot is assigned a behavior pattern that simulates different types of real users:

### Explorer Pattern
- **50%** - Visit profiles (deep viewing)
- **30%** - Browse profiles
- **15%** - Like profiles
- **5%** - Change tags

**Simulates:** Users who like to explore and discover new profiles

### Liker Pattern
- **50%** - Like profiles
- **30%** - Visit profiles
- **15%** - Browse profiles
- **5%** - Change tags

**Simulates:** Users who are quick to like and engage

### Social Pattern
- **40%** - Send messages (if connected)
- **30%** - Like profiles
- **20%** - Visit profiles
- **10%** - Change tags

**Simulates:** Users focused on messaging and building connections

### Active Pattern
- **25%** - Like profiles
- **20%** - Visit profiles
- **20%** - Browse profiles
- **15%** - Send messages
- **20%** - Change tags

**Simulates:** Very active users who do everything frequently

### Casual Pattern (Default)
- **35%** - Browse profiles
- **20%** - Visit profiles
- **20%** - Like profiles
- **15%** - Change tags
- **10%** - Send messages

**Simulates:** Balanced, casual users with normal activity levels

## User Bias System

The simulator includes a **believable bias system** that slightly favors non-bot users:

- **70% chance** to interact with real (non-bot) users
- **30% chance** to interact with other bots

This creates realistic traffic patterns where real users receive more attention, while still maintaining believable bot-to-bot interactions.

### Example Flow

\`\`\`
Bot 1: Authenticates → Waits 30s → Likes profile #42 → Waits 30s → Views profile #15 → ...
Bot 2: Authenticates → Waits 30s → Changes tags → Waits 30s → Sends message → ...
Bot 3: Authenticates → Waits 30s → Stays online → Waits 30s → Likes profile #7 → ...
\`\`\`

## Use Cases

### Development & Testing

- Test API endpoints under load
- Verify fame rating calculations
- Test notification systems
- Validate database performance

### Demo & Presentation

- Generate realistic traffic for demos
- Show active user engagement
- Demonstrate platform features with live data

### Load Testing

- Test server capacity
- Identify performance bottlenecks
- Validate scaling strategies

## Best Practices

### Bot Account Management

- Use dedicated bot accounts (marked with \`is_bot=1\`)
- Don't use real user accounts for simulation
- Clean up test data regularly

### Performance Considerations

- Start with low concurrency and increase gradually
- Monitor server resources during simulation
- Adjust intervals based on server capacity

### Safety

- Only run on development/staging servers
- Never run against production with real user data
- Use appropriate intervals to avoid overwhelming the server

## Troubleshooting

### "No bot users found"

**Solution:** Run \`make 500\` first to generate bot users with \`is_bot=1\` flag.

### "Failed to login bot"

**Solution:** Ensure bot accounts have the default password (\`test123\`) or update the password in the simulator code.

### "Connection refused"

**Solution:** Make sure the Matcha server is running on the specified port (default: 8080).

### High CPU/Memory Usage

**Solution:** Reduce the \`-concurrency\` flag or increase the \`-interval\` to slow down bot activity.

## Advanced Usage

### Custom Bot Behavior

You can modify \`cmd/bot-simulator/main.go\` to:
- Change action probabilities
- Add new action types
- Customize bot behavior patterns
- Implement custom logic

### Integration with CI/CD

\`\`\`bash
# Example CI script
#!/bin/bash
make 500  # Generate test users
make bot-simulator &  # Start simulator in background
sleep 60  # Let it run for 1 minute
# Run your tests here
pkill -f bot-simulator  # Stop simulator
\`\`\`

## Activity Logging

All bot actions are logged to the \`bot_activity_log\` table in the database. The log includes:

- Bot ID and username
- Action type (visit_profile, like_profile, send_message, add_tag, etc.)
- Target user (if applicable)
- Timestamp
- Additional details

You can view the activity log in real-time at the [Bot Activity Log](/bot-activity) page, which displays:
- All bot actions in a sortable table
- Pagination for large datasets
- Filtering by bot, action type, or time range

## API Endpoints Used

The simulator uses these API endpoints:

- \`POST /api/login\` - Bot authentication
- \`GET /api/browse\` - Get profiles to interact with
- \`POST /api/like/:id\` - Like a profile
- \`GET /api/user/:id\` - Visit/view a profile (generates view record)
- \`POST /api/tags/add\` - Add a tag
- \`POST /api/tags/remove\` - Remove a tag
- \`POST /api/messages/:id\` - Send a message
- \`GET /api/profile\` - Update online status
- \`GET /api/connections\` - Get connections for messaging

The simulator also queries the database directly to:
- Check if users are bots (for bias system)
- Log activity to \`bot_activity_log\` table

## Summary

The bot simulator is a powerful tool for generating realistic traffic on the Matcha platform. Use it responsibly for development, testing, and demonstrations.

For more information, see the [API Documentation](/help/api_explanation).
`;

export default function GolangSimulationPage() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  const handleHeadingsExtracted = (extractedHeadings: Heading[]) => {
    setHeadings(extractedHeadings);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1">
          <MarkdownRenderer 
            content={content} 
            onHeadingsExtracted={handleHeadingsExtracted}
          />
        </div>
        <div className="hidden lg:block">
          <ScrollSpy headings={headings} />
        </div>
      </div>
    </div>
  );
}
