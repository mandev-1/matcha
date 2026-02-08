"use client";

import React, { useState } from "react";
import MarkdownRenderer, { type Heading } from "@/components/MarkdownRenderer";
import ScrollSpy from "@/components/ScrollSpy";

const content = `# Fame Rating System

## Overview

The Fame Rating system is a level-based gamification feature that rewards users for being active and engaging with the platform. Your fame rating determines your level, which is displayed on your profile and in search results.

## How It Works

### Level Calculation

- **Level = floor(fame_rating)** (rounded down to the nearest integer)
- All users start at **Level 1** (fame_rating = 1.0)
- Maximum level is **Level 100** (fame_rating >= 100.0)
- Users at Level 100 or above receive a special rainbow shadow effect on their profile cards

### Fame Points Breakdown

Your fame rating increases based on various activities:

| Activity | Points Awarded | Notes |
|----------|---------------|-------|
| **Liking someone** | +0.5 points | When you like another user's profile |
| **Receiving a like** | +1.0 points | When someone likes your profile |
| **Sending a message** | +0.1 points | Per message sent in a chat |
| **Uploading a picture** | +0.3 points | Per picture uploaded (maximum 5 pictures = 1.5 points total) |
| **Getting a connection** | +2.0 points | When you get a mutual like (both users like each other) |
| **Profile view** | +0.05 points | When someone views your profile (first view only) |

## Examples

### Example 1: New User

- Starts at Level 1 (1.0 points)
- Likes 5 profiles: +2.5 points → Total: 3.5 points → **Level 3**
- Receives 3 likes: +3.0 points → Total: 6.5 points → **Level 6**
- Uploads 3 pictures: +0.9 points → Total: 7.4 points → **Level 7**

### Example 2: Active User

- Level 7 (7.4 points)
- Gets 2 connections: +4.0 points → Total: 11.4 points → **Level 11**
- Sends 20 messages: +2.0 points → Total: 13.4 points → **Level 13**
- Receives 10 profile views: +0.5 points → Total: 13.9 points → **Level 13**

### Example 3: Power User

- Level 50 (50.0 points)
- Has uploaded 5 pictures: +1.5 points (already counted)
- Gets 10 connections: +20.0 points → Total: 70.0 points → **Level 70**
- Sends 100 messages: +10.0 points → Total: 80.0 points → **Level 80**
- Receives 50 likes: +50.0 points → Total: 130.0 points → **Level 100** (max level!)

## Strategies to Level Up

### Quick Wins

1. **Upload all 5 pictures** - Easy 1.5 points (Level 1 → Level 2)
2. **Like 10 profiles** - 5.0 points (Level 2 → Level 6)
3. **Complete your profile** - Makes you more likely to receive likes

### Long-term Growth

1. **Be active daily** - Regular activity increases your chances of connections
2. **Engage in conversations** - Messages add up over time
3. **Be genuine** - Authentic profiles get more likes and views

### Maximizing Points

- **Focus on connections** - 2.0 points per connection is the highest single action reward
- **Upload quality photos** - Better photos = more likes = more points
- **Stay active** - Regular activity keeps you visible and increases interactions

## Frequently Asked Questions

### Q: How often is my fame rating updated?

A: Your fame rating is recalculated automatically after each action (like, message, etc.). The update happens asynchronously, so there may be a slight delay.

### Q: Can I see my exact fame rating?

A: Yes! Your fame rating is displayed on your profile. The level (integer) is shown prominently, and the exact decimal value is used for calculations.

### Q: Do old actions still count?

A: Yes! Your fame rating is calculated from all your historical activity. All likes, messages, and connections you've ever made contribute to your current rating.

### Q: Why did my level not increase after an action?

A: Your level only increases when your fame_rating crosses an integer threshold. For example, if you're at 5.9 points and gain 0.1 points, you'll be at 6.0 points and reach Level 6. If you're at 5.1 points and gain 0.1 points, you'll be at 5.2 points but still at Level 5.

### Q: Are there any penalties or ways to lose points?

A: No, the fame rating system only adds points. There are no penalties for inactivity or negative actions.

### Q: How is fame rating used in the platform?

A: Fame rating is displayed on your profile and can be used as a sorting option in the Discover page. Users can filter and sort profiles by fame rating to find highly active and engaged users.

## Technical Details

- Fame rating is stored as a \`REAL\` (float64) in the database
- Level is calculated client-side using \`Math.floor(fame_rating)\` in JavaScript or \`int(math.Floor(fame_rating))\` in Go
- Fame rating updates are processed asynchronously to avoid blocking user actions
- The system recalculates your total fame rating from scratch each time, ensuring accuracy

## Special Features

### Level 100 Badge

Users who reach Level 100 receive a special visual indicator - a rainbow shadow effect on their profile cards. This is a prestigious achievement that shows your dedication to the platform!

### Leaderboards (Coming Soon)

Future updates may include leaderboards showing top users by fame rating, giving you even more motivation to stay active and engaged.

## Summary

The Fame Rating system rewards active, engaged users and provides a fun way to track your activity on the platform. Start at Level 1 and work your way up by interacting with others, uploading content, and building connections!

**Remember:** The goal isn't just to level up - it's to have meaningful interactions and build real connections. The fame rating is just a fun way to track your journey!
`;

export default function MafiaPage() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1">
          <MarkdownRenderer
            content={content}
            onHeadingsExtracted={setHeadings}
          />
        </div>
        <div className="hidden lg:block">
          <ScrollSpy headings={headings} />
        </div>
      </div>
    </div>
  );
}
