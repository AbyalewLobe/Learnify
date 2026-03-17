# Learnify Backend API

A comprehensive RESTful API system that powers an online learning platform supporting Students, Creators, and Admins.

## Features

- Multi-role authentication and authorization (Student, Creator, Admin)
- Course creation and management with approval workflow
- Video upload, processing, and adaptive streaming
- Payment processing with revenue distribution
- Progress tracking and certificate generation
- Discussion forums and note-taking
- Advanced search and filtering
- Analytics dashboards

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: AWS S3 + CloudFront CDN
- **Video Processing**: AWS MediaConvert
- **Payments**: Stripe
- **Email**: AWS SES

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- AWS Account (for S3, CloudFront, SES, MediaConvert)
- Stripe Account

### Installation

1. Clone the repository and navigate to backend directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   - Database connection (PostgreSQL)
   - Redis connection
   - JWT secrets
   - Stripe API keys
   - AWS credentials and service configurations

### Required Environment Variables

The following environment variables are required for the application to start:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for access tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `STRIPE_SECRET_KEY`: Stripe secret API key
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

See `.env.example` for a complete list of available configuration options.

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

### Code Quality

Run linting:
```bash
npm run lint
npm run lint:fix
```

Format code:
```bash
npm run format
```

### Testing

Run tests:
```bash
npm test
npm run test:watch
```

## Project Structure

```
src/
├── controllers/     # Express route handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── models/          # TypeScript interfaces and types
├── middleware/      # Express middleware
├── config/          # Configuration files
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## API Documentation

The API follows RESTful conventions and returns JSON responses. All endpoints are prefixed with `/api/v1`.

### Health Check

- `GET /health` - Returns server health status

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

More endpoints will be documented as they are implemented.

## Security

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens with short expiration times (15 minutes for access tokens)
- Rate limiting (100 requests per minute per IP)
- CORS protection
- Input validation and sanitization
- SQL injection prevention through parameterized queries

## License

MIT