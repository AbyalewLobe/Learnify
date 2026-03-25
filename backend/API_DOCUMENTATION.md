# Learnify API Documentation

## Overview

The Learnify API provides RESTful endpoints for managing an online learning platform. This includes user authentication, course management, and more.

The API is built with:
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Storage**: AWS S3 for file uploads
- **Cache**: Redis for session management

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.learnify.com/api/v1`

## Interactive API Documentation

Access the interactive Swagger UI documentation at:

- **Development**: http://localhost:3000/api-docs
- **Production**: https://api.learnify.com/api-docs

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication support

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

### Token Lifecycle

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days

Use the `/api/v1/auth/refresh` endpoint to obtain a new access token using your refresh token.

## Available Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login with email and password | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout and invalidate refresh token | Yes |
| POST | `/auth/password/reset` | Request password reset | No |
| POST | `/auth/password/confirm` | Confirm password reset with token | No |

### Course Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/courses` | List all published courses | No | - |
| GET | `/courses/:id` | Get course details | No | - |
| POST | `/courses` | Create a new course | Yes | creator, admin |
| PUT | `/courses/:id` | Update a course | Yes | creator, admin (owner) |
| DELETE | `/courses/:id` | Delete a course (draft only) | Yes | creator, admin (owner) |
| POST | `/courses/:id/submit` | Submit course for review | Yes | creator, admin (owner) |
| GET | `/courses/my` | List my courses | Yes | creator, admin |

## Quick Start

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "role": "student"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 3. Create a Course (Creator/Admin Only)

```bash
curl -X POST http://localhost:3000/api/v1/courses \
  -H "Authorization: Bearer <your-access-token>" \
  -F "title=Introduction to TypeScript" \
  -F "description=Learn TypeScript from scratch" \
  -F "price=49.99" \
  -F "level=beginner" \
  -F "thumbnail=@/path/to/image.jpg" \
  -F "tags=typescript,programming,web-development"
```

### 4. List Published Courses

```bash
curl -X GET "http://localhost:3000/api/v1/courses?page=1&limit=20"
```

### 5. Get Course Details

```bash
curl -X GET http://localhost:3000/api/v1/courses/<course-id>
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Authentication required or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limiting

- **Limit**: 100 requests per minute per IP address
- **Headers**: Rate limit information is included in response headers

## File Uploads

### Course Thumbnails

- **Endpoint**: POST `/courses` or PUT `/courses/:id`
- **Field Name**: `thumbnail`
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 10MB
- **Storage**: AWS S3

## User Roles

### Student
- View published courses
- Enroll in courses
- Track progress

### Creator
- All student permissions
- Create and manage courses
- Submit courses for review

### Admin
- All creator permissions
- Approve/reject courses
- Manage all users and courses

## Testing with Postman

1. Import the API into Postman using the OpenAPI spec:
   - Go to http://localhost:3000/api-docs
   - Copy the JSON spec
   - Import into Postman

2. Set up environment variables:
   - `base_url`: http://localhost:3000/api/v1
   - `access_token`: (set after login)
   - `refresh_token`: (set after login)

3. Use the Authorization tab:
   - Type: Bearer Token
   - Token: `{{access_token}}`

## Development

### Running the Server

```bash
cd backend
npm install
npm run dev
```

The server will start on http://localhost:3000

### Environment Variables

Required environment variables (see `.env.example`):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Support

For API support or questions:
- Email: support@learnify.com
- Documentation: http://localhost:3000/api-docs
- GitHub: https://github.com/learnify/api

## License

MIT License - see LICENSE file for details
