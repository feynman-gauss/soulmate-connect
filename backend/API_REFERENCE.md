# API Endpoints Quick Reference

## Base URL
```
http://localhost:8000
```

## Authentication

### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "1234567890",
  "age": 28,
  "gender": "male",
  "password": "SecurePass123",
  "looking_for": "female"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

### Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

## Profiles

### Get My Profile
```bash
GET /api/v1/profiles/me
Authorization: Bearer <access_token>
```

### Update Profile
```bash
PUT /api/v1/profiles/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  },
  "religion": "Hindu",
  "education": "MBA",
  "occupation": "Software Engineer",
  "height": "5'10\"",
  "about": "Passionate about technology...",
  "interests": ["Travel", "Photography", "Music"]
}
```

### Upload Photo
```bash
POST /api/v1/profiles/photos
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <image_file>
```

## Discovery & Matching

### Get Discovery Profiles
```bash
GET /api/v1/discover?limit=20
Authorization: Bearer <access_token>
```

### Swipe on Profile
```bash
POST /api/v1/discover/swipes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "target_user_id": "user_id_here",
  "action": "like"  // or "pass" or "super_like"
}
```

### Get Received Likes
```bash
GET /api/v1/discover/likes/received
Authorization: Bearer <access_token>
```

## Matches

### Get All Matches
```bash
GET /api/v1/matches
Authorization: Bearer <access_token>
```

### Get Match Details
```bash
GET /api/v1/matches/{match_id}
Authorization: Bearer <access_token>
```

## Chat

### Get Conversations
```bash
GET /api/v1/chat/conversations
Authorization: Bearer <access_token>
```

### Get Messages
```bash
GET /api/v1/chat/{match_id}/messages?limit=50
Authorization: Bearer <access_token>
```

### Send Message
```bash
POST /api/v1/chat/{match_id}/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Hello! Nice to match with you!",
  "message_type": "text"
}
```

### Mark as Read
```bash
PUT /api/v1/chat/{match_id}/read
Authorization: Bearer <access_token>
```

## Search

### Search Profiles
```bash
GET /api/v1/search?query=engineer&location=Mumbai&min_age=25&max_age=35
Authorization: Bearer <access_token>
```

### Get Suggestions
```bash
GET /api/v1/search/suggestions
Authorization: Bearer <access_token>
```

## Notifications

### Get Notifications
```bash
GET /api/v1/notifications
Authorization: Bearer <access_token>
```

### Mark as Read
```bash
PUT /api/v1/notifications/{notification_id}/read
Authorization: Bearer <access_token>
```

### Get Unread Count
```bash
GET /api/v1/notifications/unread/count
Authorization: Bearer <access_token>
```

## WebSocket

### Connect to Chat
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat?token=<access_token>');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send typing indicator
ws.send(JSON.stringify({
  type: 'typing',
  receiver_id: 'user_id',
  match_id: 'match_id'
}));

// Send message notification
ws.send(JSON.stringify({
  type: 'message',
  receiver_id: 'user_id',
  match_id: 'match_id',
  message: 'Hello!'
}));
```

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "phone": "1234567890",
    "age": 28,
    "gender": "male",
    "password": "Test@123",
    "looking_for": "female"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:8000/api/v1/profiles/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
