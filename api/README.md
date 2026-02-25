# Soulmate Connect - Backend API

A modern, scalable backend API for the Soulmate Connect matrimonial platform built with FastAPI and MongoDB.

## 🚀 Features

- **User Authentication** - JWT-based secure authentication
- **Profile Management** - Complete user profiles with photo uploads
- **Smart Matching** - Compatibility-based discovery algorithm
- **Real-time Chat** - WebSocket-powered messaging
- **Advanced Search** - Filter by location, education, religion, etc.
- **Notifications** - Real-time activity alerts
- **Premium Features** - Subscription management

## 🛠️ Technology Stack

- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database for flexible data storage
- **Motor** - Async MongoDB driver
- **PyJWT** - JWT authentication
- **Passlib** - Password hashing
- **WebSockets** - Real-time communication

## 📋 Prerequisites

- Python 3.11+
- MongoDB 7.0+
- Docker & Docker Compose (optional)

## 🔧 Installation

### Option 1: Local Development

1. **Clone the repository**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

6. **Run the application**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Option 2: Docker Compose (Recommended)

1. **Copy environment file**
```bash
cp .env.example .env
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **View logs**
```bash
docker-compose logs -f backend
```

4. **Stop services**
```bash
docker-compose down
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## 🔐 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Database
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=soulmate_connect

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=5242880  # 5MB
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   │   ├── auth.py      # Authentication
│   │   ├── profiles.py  # Profile management
│   │   ├── discover.py  # Discovery & matching
│   │   ├── matches.py   # Match management
│   │   ├── chat.py      # Messaging
│   │   ├── search.py    # Search functionality
│   │   └── notifications.py
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   ├── websockets/      # WebSocket handlers
│   ├── config.py        # Configuration
│   ├── database.py      # Database connection
│   └── main.py          # FastAPI app
├── tests/               # Unit tests
├── uploads/             # File uploads
├── requirements.txt     # Dependencies
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

### Profiles
- `GET /api/v1/profiles/me` - Get my profile
- `PUT /api/v1/profiles/me` - Update my profile
- `POST /api/v1/profiles/photos` - Upload photo
- `GET /api/v1/profiles/{user_id}` - Get user profile

### Discovery & Matching
- `GET /api/v1/discover` - Get discovery profiles
- `POST /api/v1/discover/swipes` - Swipe on profile
- `GET /api/v1/discover/likes/received` - Get received likes

### Matches
- `GET /api/v1/matches` - Get all matches
- `GET /api/v1/matches/{match_id}` - Get match details
- `DELETE /api/v1/matches/{match_id}` - Unmatch

### Chat
- `GET /api/v1/chat/conversations` - Get conversations
- `GET /api/v1/chat/{match_id}/messages` - Get messages
- `POST /api/v1/chat/{match_id}/messages` - Send message
- `PUT /api/v1/chat/{match_id}/read` - Mark as read

### Search
- `GET /api/v1/search` - Search profiles
- `GET /api/v1/search/suggestions` - Get suggestions

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read

## 🧪 Testing

Run tests with pytest:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app tests/
```

## 🚀 Deployment

### Production Checklist

1. ✅ Set `DEBUG=False` in environment
2. ✅ Use strong `JWT_SECRET_KEY`
3. ✅ Configure MongoDB authentication
4. ✅ Configure CORS origins
5. ✅ Set up SSL/TLS certificates
6. ✅ Configure file storage (S3)
7. ✅ Set up monitoring and logging
8. ✅ Configure backup strategy

### Deploy with Docker

```bash
# Build production image
docker build -t soulmate-backend:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  --env-file .env.production \
  --name soulmate-backend \
  soulmate-backend:latest
```

## 🔒 Security

- Passwords hashed with bcrypt
- JWT token-based authentication
- CORS protection
- Input validation with Pydantic
- Rate limiting (configurable)
- File upload validation

## 📊 Database Schema

### Collections

1. **users** - User profiles and authentication
2. **swipes** - Like/pass/super-like actions
3. **matches** - Mutual matches
4. **messages** - Chat messages
5. **notifications** - Activity notifications
6. **subscriptions** - Premium subscriptions
7. **profile_views** - Profile view tracking
8. **reports** - User reports

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@soulmateconnect.com or open an issue.

## 🎯 Roadmap

- [ ] Email verification
- [ ] SMS OTP authentication
- [ ] Payment gateway integration
- [ ] Video call feature
- [ ] AI-powered matching
- [ ] Mobile app API optimization
- [ ] Admin dashboard API

---

**Built with ❤️ for Soulmate Connect**
