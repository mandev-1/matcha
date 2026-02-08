# Fame Rating System - FAQ

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

### Examples

**Example 1: New User**
- Starts at Level 1 (1.0 points)
- Likes 5 profiles: +2.5 points → Total: 3.5 points → **Level 3**
- Receives 3 likes: +3.0 points → Total: 6.5 points → **Level 6**
- Uploads 3 pictures: +0.9 points → Total: 7.4 points → **Level 7**

**Example 2: Active User**
- Level 7 (7.4 points)
- Gets 2 connections: +4.0 points → Total: 11.4 points → **Level 11**
- Sends 20 messages: +2.0 points → Total: 13.4 points → **Level 13**
- Receives 10 profile views: +0.5 points → Total: 13.9 points → **Level 13**

**Example 3: Power User**
- Level 50 (50.0 points)
- Has uploaded 5 pictures: +1.5 points (already counted)
- Gets 10 connections: +20.0 points → Total: 70.0 points → **Level 70**
- Sends 100 messages: +10.0 points → Total: 80.0 points → **Level 80**

## Frequently Asked Questions

### Q: How do I increase my fame rating?

A: Be active on the platform! Like profiles, upload pictures, send messages, and engage with other users. The more you interact, the higher your fame rating will be.

### Q: Do I lose points if someone unlikes me?

A: No, your fame rating is based on cumulative activities. Once you've earned points, they remain in your total even if someone unlikes you later.

### Q: Is there a maximum number of points I can earn?

A: There's no hard cap on points, but the maximum level displayed is Level 100. Users at Level 100 or above receive special visual effects (rainbow shadow) on their profile cards.

### Q: How often is my fame rating updated?

A: Your fame rating is recalculated automatically whenever you perform an action that affects it (like, receive like, send message, upload picture, get connection, receive view). The update happens asynchronously in the background.

### Q: Can I see how many points I need for the next level?

A: Your current level is displayed on your profile. To reach the next level, you need to increase your fame_rating by 1.0 point. For example, if you're at Level 5 (5.0-5.9 points), you need to reach 6.0 points to become Level 6.

### Q: Do profile views from the same person count multiple times?

A: No, only the first view from each person counts toward your fame rating. Subsequent views from the same person don't add additional points.

### Q: What's the fastest way to level up?

A: Getting connections (mutual likes) gives the most points per action (2.0 points each). However, the best strategy is to be consistently active: upload pictures, like profiles, send messages, and engage with the community.

### Q: Why did my level not increase after an action?

A: Your level only increases when your fame_rating crosses an integer threshold. For example, if you're at 5.9 points and gain 0.1 points, you'll be at 6.0 points and reach Level 6. If you're at 5.1 points and gain 0.1 points, you'll be at 5.2 points but still at Level 5.

### Q: Are there any penalties or ways to lose points?

A: No, the fame rating system only adds points. There are no penalties for inactivity or negative actions.

### Q: How is fame rating used in the platform?

A: Fame rating is displayed on your profile and can be used as a sorting option in the Discover page. Users can filter and sort profiles by fame rating to find highly active and engaged users.

## Technical Details

- Fame rating is stored as a `REAL` (float64) in the database
- Level is calculated client-side using `Math.floor(fame_rating)` in JavaScript or `int(math.Floor(fame_rating))` in Go
- Fame rating updates are processed asynchronously to avoid blocking user actions
- The system recalculates your total fame rating from scratch each time, ensuring accuracy

## Summary

The Fame Rating system rewards active, engaged users and provides a fun way to track your activity on the platform. Start at Level 1 and work your way up by interacting with others, uploading content, and building connections!
