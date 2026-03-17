# Authentication System Implementation

## Overview
This document describes the complete authentication system implemented for the Learnify Backend API.

## Components Implemented

### 1. Password Hashing Service (`src/services/PasswordService.ts`)
- **Purpose**: Secure password hashing and validation using bcrypt
- **Features**:
  - Hash passwords with 12 salt rounds (configurable)
  - Compare plain text passwords with hashed passwords
  - Validate password complexity (minimum 8 characters)
- **Usage**:
  ```typescript
  import { passwordService } from './services/PasswordService';
  
  const hashedPassword = await passwordService.hash('myPassword123');
  const isValid = await passwordService.compare('myPassword123', hashedPassword);
  ```

### 2. JWT Token Service (`src/services/TokenService.ts`)
- **Purpose**: Generate and validate JWT tokens using RS256 algorithm
- **Features**:
  - Generate access tokens (15 minutes expiry)
  - Generate refresh tokens (7 days expiry)
  - Validate tokens with signature verification
  - Token rotation for refresh tokens
  - RSA key pair for asymmetric encryption
- **Key Files**:
  - `backend/keys/jwt-private.pem` - Private key for signing (gitignored)
  - `backend/keys/jwt-public.pem` - Public key for verification
- **Usage**:
  ```typescript
  import { tokenService } from './services/TokenService';
  
  const tokens = tokenService.generateTokens(userId, email, role);
  const payload = tokenService.validateToken(accessToken);
  ```

### 3. User Repository (`src/repositories/UserRepository.ts`)
- **Purpose**: Database operations for user management
- **Features**:
  - Create new users
  - Find users by ID or email
  - Update user information
  - Update passwords
  - Activate/deactivate users
  - Check email existence
- **Database Table**: `users`

### 4. Refresh Token Repository (`src/repositories/RefreshTokenRepository.ts`)
- **Purpose**: Manage refresh tokens in database
- **Features**:
  - Store refresh token hashes
  - Validate token existence and expiration
  - Revoke tokens (single or all for a user)
  - Clean up expired tokens
- **Database Table**: `refresh_tokens`

### 5. Validation Schemas (`src/utils/validation.ts`)
- **Purpose**: Input validation using Joi
- **Schemas**:
  - `registerSchema` - User registration validation
  - `loginSchema` - Login credentials validation
  - `refreshTokenSchema` - Refresh token validation
  - `passwordResetRequestSchema` - Password reset request validation
  - `passwordResetConfirmSchema` - Password reset confirmation validation
- **Middleware**: `validate()` factory function for route validation

### 6. Authentication Controller (`src/controllers/authController.ts`)
- **Purpose**: Handle authentication HTTP requests
- **Endpoints Implemented**:

#### POST /api/v1/auth/register
- Register a new user
- Validates input (email, password, name, role)
- Checks for duplicate emails
- Hashes password before storage
- Returns user data (without password hash)

#### POST /api/v1/auth/login
- Authenticate user with email and password
- Validates credentials
- Checks if user is active
- Generates access and refresh tokens
- Stores refresh token hash in database
- Caches user session in Redis (15 minutes)
- Returns user data and tokens

#### POST /api/v1/auth/refresh
- Refresh access token using refresh token
- Validates refresh token
- Checks token in database (not revoked, not expired)
- Implements token rotation (generates new refresh token)
- Revokes old refresh token
- Returns new tokens

#### POST /api/v1/auth/logout
- Logout user and revoke tokens
- Revokes refresh token in database
- Clears user session from Redis cache
- Requires authentication (user ID from token)

#### POST /api/v1/auth/password/reset
- Request password reset
- Generates time-limited reset token (1 hour)
- Stores reset token in Redis
- Sends reset email via AWS SES
- Returns success regardless of email existence (prevents enumeration)

#### POST /api/v1/auth/password/confirm
- Confirm password reset with token
- Validates reset token from Redis
- Checks token expiration
- Hashes new password
- Updates user password
- Revokes all refresh tokens for security
- Deletes reset token from Redis

### 7. Authentication Routes (`src/routes/authRoutes.ts`)
- **Purpose**: Define authentication API routes
- **Routes**:
  - `POST /api/v1/auth/register` - Register new user
  - `POST /api/v1/auth/login` - Login user
  - `POST /api/v1/auth/refresh` - Refresh tokens
  - `POST /api/v1/auth/logout` - Logout user
  - `POST /api/v1/auth/password/reset` - Request password reset
  - `POST /api/v1/auth/password/confirm` - Confirm password reset

## Security Features

### 1. Password Security
- bcrypt hashing with 12 salt rounds
- Minimum password length validation (8 characters)
- Password complexity can be extended

### 2. Token Security
- RS256 asymmetric encryption
- Short-lived access tokens (15 minutes)
- Refresh token rotation
- Token revocation support
- Refresh tokens stored as hashes in database

### 3. Session Management
- Redis caching for active sessions
- Session expiration (15 minutes)
- Session cleanup on logout

### 4. Password Reset Security
- Time-limited reset tokens (1 hour)
- Tokens stored in Redis with expiration
- Tokens are single-use (deleted after use)
- All refresh tokens revoked after password reset
- Email enumeration prevention

### 5. Input Validation
- Joi schema validation for all inputs
- Email format validation
- Password strength validation
- Required field validation

## Configuration

### Environment Variables Required
```env
# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
PASSWORD_MIN_LENGTH=8

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/learnify_db

# Redis
REDIS_URL=redis://localhost:6379

# AWS SES (for password reset emails)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@learnify.com
SES_FROM_NAME=Learnify Platform

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### RSA Key Generation
The system uses RSA key pairs for JWT signing. Keys are generated using:
```bash
# Generate private key
openssl genrsa -out backend/keys/jwt-private.pem 2048

# Generate public key
openssl rsa -in backend/keys/jwt-private.pem -pubout -out backend/keys/jwt-public.pem
```

**Note**: The private key is gitignored for security.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'creator', 'admin')),
  is_active BOOLEAN DEFAULT true,
  profile_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);
```

## Testing

### Unit Tests
Test file: `src/__tests__/auth.test.ts`

**Test Coverage**:
- User registration (success, duplicate email, invalid input)
- User login (success, invalid credentials)
- Token refresh (success, invalid token)
- Token rotation verification

**Running Tests**:
```bash
npm test -- auth.test.ts
```

**Note**: Tests require PostgreSQL and Redis to be running.

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 900
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## Integration with Main Application

The authentication routes are integrated in `src/index.ts`:
```typescript
import authRoutes from './routes/authRoutes';
app.use('/api/v1/auth', authRoutes);
```

## Next Steps

The following tasks are marked as optional (property-based tests):
- Task 3.2: Write property test for password hashing
- Task 3.4: Write property test for token generation
- Task 3.7: Write property test for authentication failure handling

These can be implemented using the `fast-check` library which is already installed.

## Dependencies

### Production Dependencies
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation and validation
- `joi` - Input validation
- `express` - Web framework
- `pg` - PostgreSQL client
- `redis` - Redis client
- `aws-sdk` - AWS services (SES for emails)
- `crypto` - Node.js crypto module (built-in)

### Development Dependencies
- `@types/bcrypt` - TypeScript types
- `@types/jsonwebtoken` - TypeScript types
- `jest` - Testing framework
- `supertest` - HTTP testing
- `fast-check` - Property-based testing (for optional tasks)

## Architecture

The authentication system follows a layered architecture:

1. **Routes Layer** (`src/routes/authRoutes.ts`)
   - Defines HTTP endpoints
   - Applies validation middleware

2. **Controller Layer** (`src/controllers/authController.ts`)
   - Handles HTTP requests and responses
   - Orchestrates business logic
   - Error handling

3. **Service Layer** (`src/services/`)
   - Business logic implementation
   - Password hashing (PasswordService)
   - Token generation and validation (TokenService)

4. **Repository Layer** (`src/repositories/`)
   - Database operations
   - User management (UserRepository)
   - Token management (RefreshTokenRepository)

5. **Validation Layer** (`src/utils/validation.ts`)
   - Input validation schemas
   - Validation middleware

This separation ensures:
- Single Responsibility Principle
- Easy testing and mocking
- Maintainability
- Scalability
