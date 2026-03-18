import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/TokenService';
import { redisClient } from '../config/redis';
import { userRepository } from '../repositories/UserRepository';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'student' | 'creator' | 'admin';
  };
}

/**
 * Authentication middleware for protected routes
 * Extracts and validates JWT from Authorization header
 * Loads user data from Redis cache or database
 * Attaches user object to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token signature and expiration
    let payload;
    try {
      payload = tokenService.validateToken(token);
    } catch (error) {
      logger.error('Token validation failed:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    // Check if token is access token (not refresh token)
    if (payload.type !== 'access') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type. Please use an access token.',
      });
      return;
    }

    // Try to load user data from Redis cache
    const cacheKey = `user:${payload.userId}`;
    let userData;

    try {
      const cachedUser = await redisClient.get(cacheKey);
      if (cachedUser) {
        userData = JSON.parse(cachedUser);
        logger.debug(`User ${payload.userId} loaded from cache`);
      }
    } catch (error) {
      logger.warn('Redis cache read failed:', error);
    }

    // If not in cache, load from database
    if (!userData) {
      try {
        const user = await userRepository.findById(payload.userId);
        
        if (!user) {
          res.status(401).json({
            success: false,
            message: 'User not found. Please log in again.',
          });
          return;
        }

        if (!user.is_active) {
          res.status(401).json({
            success: false,
            message: 'Account is inactive. Please contact support.',
          });
          return;
        }

        userData = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };

        // Cache user data for 15 minutes
        try {
          await redisClient.setex(cacheKey, 900, JSON.stringify(userData));
        } catch (error) {
          logger.warn('Redis cache write failed:', error);
        }

        logger.debug(`User ${payload.userId} loaded from database`);
      } catch (error) {
        logger.error('Error loading user from database:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
        return;
      }
    }

    // Attach user object to request
    req.user = userData;

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
