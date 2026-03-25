import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

type ResourceType = 'course' | 'chapter' | 'lesson';

/**
 * Course ownership validation middleware
 * Checks if user is the course creator or an admin
 * Must be used after authenticate middleware
 *
 * @param resourceType - Type of resource to check ownership for
 * @returns Express middleware function
 *
 * @example
 * router.put('/courses/:id', authenticate, authorizeOwnership('course'), updateCourseHandler);
 * router.delete('/chapters/:id', authenticate, authorizeOwnership('chapter'), deleteChapterHandler);
 */
export const authorizeOwnership = (resourceType: ResourceType) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Ownership authorization attempted without authentication');
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Admins have access to all resources
      if (req.user.role === 'admin') {
        logger.debug(`Admin ${req.user.userId} granted access to ${resourceType} ${req.params.id}`);
        next();
        return;
      }

      // Get resource ID from route parameters
      const resourceId = req.params.id || req.params.courseId || req.params.chapterId;

      if (!resourceId) {
        logger.error('Resource ID not found in request parameters');
        res.status(400).json({
          success: false,
          message: 'Resource ID is required',
        });
        return;
      }

      // Check ownership based on resource type
      let isOwner = false;

      try {
        switch (resourceType) {
          case 'course':
            isOwner = await checkCourseOwnership(req.user.userId, resourceId);
            break;
          case 'chapter':
            isOwner = await checkChapterOwnership(req.user.userId, resourceId);
            break;
          case 'lesson':
            isOwner = await checkLessonOwnership(req.user.userId, resourceId);
            break;
          default:
            logger.error(`Unknown resource type: ${resourceType}`);
            res.status(500).json({
              success: false,
              message: 'Internal server error',
            });
            return;
        }
      } catch (error) {
        logger.error(`Error checking ${resourceType} ownership:`, error);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
        return;
      }

      if (!isOwner) {
        logger.warn(
          `User ${req.user.userId} denied access to ${resourceType} ${resourceId} - not owner`
        );
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.',
        });
        return;
      }

      // User is owner, proceed
      logger.debug(
        `User ${req.user.userId} granted access to ${resourceType} ${resourceId} - owner verified`
      );
      next();
    } catch (error) {
      logger.error('Ownership authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user owns a course
 */
async function checkCourseOwnership(userId: string, courseId: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { creator_id: true },
  });

  if (!course) {
    return false;
  }

  return course.creator_id === userId;
}

/**
 * Check if user owns the course that contains a chapter
 */
async function checkChapterOwnership(userId: string, chapterId: string): Promise<boolean> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      course: {
        select: {
          creator_id: true,
        },
      },
    },
  });

  if (!chapter) {
    return false;
  }

  return chapter.course.creator_id === userId;
}

/**
 * Check if user owns the course that contains a lesson
 */
async function checkLessonOwnership(userId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      chapter: {
        select: {
          course: {
            select: {
              creator_id: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return false;
  }

  return lesson.chapter.course.creator_id === userId;
}
