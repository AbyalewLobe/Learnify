import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import logger from '../utils/logger';

type UserRole = 'student' | 'creator' | 'admin';

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if authenticated user has required role(s)
 * Must be used after authenticate middleware
 * 
 * @param roles - Array of allowed roles for the route
 * @returns Express middleware function
 * 
 * @example
 * router.get('/courses/my', authenticate, authorize('creator'), getMyCoursesHandler);
 * router.post('/courses', authenticate, authorize('creator', 'admin'), createCourseHandler);
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Authorization attempted without authentication');
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if user's role is in allowed roles
      if (!roles.includes(req.user.role)) {
        logger.warn(
          `Authorization failed: User ${req.user.userId} with role ${req.user.role} attempted to access route requiring roles: ${roles.join(', ')}`
        );
        
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions. You do not have access to this resource.',
        });
        return;
      }

      // User has required role, proceed
      logger.debug(
        `Authorization successful: User ${req.user.userId} with role ${req.user.role} accessing route`
      );
      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};
