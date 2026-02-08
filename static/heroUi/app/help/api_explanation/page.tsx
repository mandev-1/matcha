"use client";

import React, { useState } from "react";
import MarkdownRenderer, { type Heading } from "@/components/MarkdownRenderer";
import ScrollSpy from "@/components/ScrollSpy";

const content = `# API Documentation

## Overview

The Matcha API is a RESTful API built with Go and Goji. All API endpoints are prefixed with \`/api\` and return JSON responses.

## Base URL

\`\`\`
http://localhost:8080/api
\`\`\`

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Authentication Endpoints

### Register

Create a new user account.

\`\`\`http
POST /api/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
\`\`\`

### Login

Authenticate and receive a JWT token.

\`\`\`http
POST /api/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepassword"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
\`\`\`

## Profile Endpoints

### Get Profile

Get the current user's profile information.

\`\`\`http
GET /api/profile
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Love hiking and coding!",
    "tags": ["#coding", "#hiking"],
    "fame_rating": 15.5,
    "pictures": ["/uploads/pic1.jpg", "/uploads/pic2.jpg"]
  }
}
\`\`\`

### Update Profile

Update profile information.

\`\`\`http
POST /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Updated bio",
  "gender": "male",
  "preference": "female"
}
\`\`\`

## Browse Endpoints

### Browse Profiles

Get a list of profiles to browse with filtering and sorting options.

\`\`\`http
GET /api/browse?limit=10&offset=0&sort_by=fame_rating&min_age=18&max_age=35
Authorization: Bearer <token>
\`\`\`

**Query Parameters:**
- \`limit\` - Number of results (default: 10)
- \`offset\` - Pagination offset (default: 0)
- \`sort_by\` - Sort by: \`age\`, \`fame_rating\`, \`location\`, \`common_tags\`
- \`min_age\` - Minimum age filter
- \`max_age\` - Maximum age filter
- \`max_distance\` - Maximum distance in km
- \`only_common_tags\` - Only show profiles with common tags (true/false)

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": 2,
        "username": "janedoe",
        "first_name": "Jane",
        "last_name": "Doe",
        "age": 28,
        "fame_rating": 12.5,
        "distance_km": 5.2,
        "tags": ["#coding", "#travel"]
      }
    ],
    "total": 50
  }
}
\`\`\`

## Interaction Endpoints

### Like a Profile

Like another user's profile.

\`\`\`http
POST /api/like/:user_id
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Profile liked successfully",
  "is_connection": false
}
\`\`\`

If it's a mutual like (connection):
\`\`\`json
{
  "success": true,
  "message": "It's a match!",
  "is_connection": true
}
\`\`\`

### Unlike a Profile

Remove a like from a profile.

\`\`\`http
DELETE /api/like/:user_id
Authorization: Bearer <token>
\`\`\`

### View a Profile

Record a profile view (increases fame rating).

\`\`\`http
GET /api/user/:user_id
Authorization: Bearer <token>
\`\`\`

## Tag Endpoints

### Add Tag

Add a tag to your profile.

\`\`\`http
POST /api/tags/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "tag": "#coding"
}
\`\`\`

### Remove Tag

Remove a tag from your profile.

\`\`\`http
POST /api/tags/remove
Authorization: Bearer <token>
Content-Type: application/json

{
  "tag": "#coding"
}
\`\`\`

### Get Popular Tags

Get a list of popular tags.

\`\`\`http
GET /api/tags/popular
Authorization: Bearer <token>
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "popular_tags": [
      {
        "tag": "#coding",
        "user_count": 150
      },
      {
        "tag": "#travel",
        "user_count": 120
      }
    ]
  }
}
\`\`\`

## Chat Endpoints

### Get Conversations

Get all conversations for the current user.

\`\`\`http
GET /api/chats
Authorization: Bearer <token>
\`\`\`

### Get Messages

Get messages for a specific conversation.

\`\`\`http
GET /api/messages/:user_id
Authorization: Bearer <token>
\`\`\`

### Send Message

Send a message to a connected user.

\`\`\`http
POST /api/messages/:user_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello! How are you?"
}
\`\`\`

## Connections Endpoint

### Get Connections

Get all users you're connected with (mutual likes).

\`\`\`http
GET /api/connections
Authorization: Bearer <token>
\`\`\`

## Error Responses

All endpoints return errors in this format:

\`\`\`json
{
  "success": false,
  "error": "Error message here"
}
\`\`\`

**Common HTTP Status Codes:**
- \`200 OK\` - Success
- \`400 Bad Request\` - Invalid request data
- \`401 Unauthorized\` - Missing or invalid token
- \`403 Forbidden\` - Insufficient permissions
- \`404 Not Found\` - Resource not found
- \`500 Internal Server Error\` - Server error

## Rate Limiting

API requests are currently not rate-limited, but this may be implemented in the future. Please use the API responsibly.

## WebSocket (Future)

Real-time messaging via WebSocket may be added in future versions for instant message delivery.

## SDKs & Libraries

### Go

\`\`\`go
import "net/http"

client := &http.Client{}
req, _ := http.NewRequest("GET", "http://localhost:8080/api/profile", nil)
req.Header.Set("Authorization", "Bearer "+token)
resp, _ := client.Do(req)
\`\`\`

### JavaScript/TypeScript

\`\`\`typescript
const response = await fetch('http://localhost:8080/api/profile', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
const data = await response.json();
\`\`\`

## Testing

You can test the API using:

- **cURL** - Command-line tool
- **Postman** - GUI API client
- **Bot Simulator** - See [Simulating Activity](/help/golang_simulation) for details

## Support

For API support or questions, please refer to:
- [FAQ](/help/frequent_Questions)
- [Simulating Activity](/help/golang_simulation)
- [Fame Rating System](/help/mafia)
`;

export default function APIExplanationPage() {
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
