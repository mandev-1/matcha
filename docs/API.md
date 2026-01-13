# API Documentation

## Base URL

All API endpoints are prefixed with `/api`

## Authentication

Most endpoints require authentication. Include authentication token in headers:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /api/register
Register a new user.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please check your email for verification."
  }
}
```

#### POST /api/login
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "john@example.com"
    }
  }
}
```

#### POST /api/logout
Logout user.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Profile

#### GET /api/profile
Get current user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "gender": "male",
    "sexual_preference": "heterosexual",
    "biography": "Love coding and hiking",
    "birth_date": "1990-01-01",
    "location": "San Francisco",
    "fame_rating": 4.5,
    "tags": ["#coding", "#hiking"]
  }
}
```

#### POST /api/profile
Update current user's profile.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "gender": "male",
  "sexual_preference": "heterosexual",
  "biography": "Updated biography",
  "birth_date": "1990-01-01",
  "location": "San Francisco",
  "tags": "#coding,#hiking,#travel"
}
```

### Browse & Search

#### GET /api/browse
Browse suggested profiles.

**Query Parameters:**
- `sort` - Sort by: `distance`, `age`, `fame`, `tags`
- `minAge` - Minimum age
- `maxAge` - Maximum age

**Response:**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": 1,
        "first_name": "Jane",
        "age": 28,
        "location": "San Francisco",
        "fame_rating": 4.8,
        "profile_picture": "url",
        "tags": ["#yoga", "#travel"]
      }
    ]
  }
}
```

#### GET /api/search
Advanced search for profiles.

**Query Parameters:**
- `age_min`, `age_max` - Age range
- `fame_min`, `fame_max` - Fame rating range
- `location` - Location filter
- `tags` - Comma-separated tags

### User Profile

#### GET /api/user/:id
Get a specific user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "age": 28,
    "location": "San Francisco",
    "biography": "Love yoga and traveling",
    "fame_rating": 4.8,
    "is_online": true,
    "last_seen": "",
    "profile_picture": "url",
    "tags": ["#yoga", "#travel"],
    "is_liked": false,
    "is_connected": false
  }
}
```

### Interactions

#### POST /api/like/:id
Like a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User liked successfully",
    "user_id": 1,
    "is_connected": false
  }
}
```

#### POST /api/unlike/:id
Unlike a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User unliked successfully",
    "user_id": 1
  }
}
```

### Chat

#### GET /api/chat
Get list of conversations.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "name": "Jane Smith",
        "avatar": "url",
        "last_message": "Hey! How are you?",
        "unread_count": 2
      }
    ]
  }
}
```

#### GET /api/messages/:id
Get messages for a conversation.

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "Hey! How are you?",
        "is_from_current_user": false,
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "chat_id": 1
  }
}
```

#### POST /api/messages/:id
Send a message.

**Request Body:**
```json
{
  "content": "Hello!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Message sent successfully",
    "chat_id": 1
  }
}
```

### Notifications

#### GET /api/notifications
Get user notifications.

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "like",
        "message": "Jane liked your profile",
        "is_read": false,
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "unread_count": 1
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

