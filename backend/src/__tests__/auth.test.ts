import request from 'supertest';
import app from '../index';
import { database } from '../config/database';
import { redisClient } from '../config/redis';

describe('Authentication System', () => {
  beforeAll(async () => {
    // Ensure Redis is connected (only if not already connected)
    try {
      if (!redisClient.isReady() && !redisClient.getClient().isOpen) {
        await redisClient.connect();
      }
    } catch (error) {
      console.warn('Redis connection warning:', error);
      // Continue with tests even if Redis is not available
    }
  });

  afterAll(async () => {
    // Clean up
    try {
      await database.close();
    } catch (error) {
      console.warn('Database cleanup warning:', error);
    }
    
    try {
      if (redisClient.isReady()) {
        await redisClient.disconnect();
      }
    } catch (error) {
      console.warn('Redis cleanup warning:', error);
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: `duplicate${Date.now()}@example.com`,
        password: 'TestPassword123',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      };

      // Register first time
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already registered');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'short',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testUser = {
      email: `logintest${Date.now()}@example.com`,
      password: 'TestPassword123',
      first_name: 'Login',
      last_name: 'Test',
      role: 'student' as const,
    };

    beforeAll(async () => {
      // Register a test user
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.tokens).toHaveProperty('expiresIn');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Register and login to get a refresh token
      const testUser = {
        email: `refreshtest${Date.now()}@example.com`,
        password: 'TestPassword123',
        first_name: 'Refresh',
        last_name: 'Test',
        role: 'student',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
