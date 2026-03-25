import { prisma } from '../config/prisma';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Enrollment verification service
 * Checks enrollment status and caches results in Redis
 */
class EnrollmentService {
  private readonly CACHE_TTL = 1800; // 30 minutes in seconds
  private readonly CACHE_PREFIX = 'enrollment:';

  /**
   * Check if a user is enrolled in a course
   * Results are cached in Redis for 30 minutes
   *
   * @param userId - The user ID to check
   * @param courseId - The course ID to check
   * @returns Promise<boolean> - true if enrolled, false otherwise
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}:${courseId}`;

    try {
      // Try to get from cache first
      const cachedResult = await redisClient.get(cacheKey);

      if (cachedResult !== null) {
        const isEnrolled = cachedResult === '1';
        logger.debug(
          `Enrollment status for user ${userId} in course ${courseId} loaded from cache: ${isEnrolled}`
        );
        return isEnrolled;
      }
    } catch (error) {
      logger.warn('Redis cache read failed for enrollment check:', error);
      // Continue to database query if cache fails
    }

    // Query database
    try {
      const result = await prisma.enrollment.findFirst({
        where: {
          student_id: userId,
          course_id: courseId,
        },
        select: {
          id: true,
        },
      });

      const isEnrolled = result !== null;

      // Cache the result
      try {
        await redisClient.set(cacheKey, isEnrolled ? '1' : '0', { EX: this.CACHE_TTL });
        logger.debug(
          `Enrollment status for user ${userId} in course ${courseId} cached: ${isEnrolled}`
        );
      } catch (error) {
        logger.warn('Redis cache write failed for enrollment status:', error);
      }

      return isEnrolled;
    } catch (error) {
      logger.error('Error checking enrollment status:', error);
      throw new Error('Failed to check enrollment status');
    }
  }

  /**
   * Invalidate enrollment cache for a user-course pair
   * Should be called when enrollment status changes
   *
   * @param userId - The user ID
   * @param courseId - The course ID
   */
  async invalidateCache(userId: string, courseId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}:${courseId}`;

    try {
      await redisClient.del(cacheKey);
      logger.debug(`Enrollment cache invalidated for user ${userId} in course ${courseId}`);
    } catch (error) {
      logger.warn('Failed to invalidate enrollment cache:', error);
    }
  }

  /**
   * Check if a user is enrolled in multiple courses
   * More efficient than calling isEnrolled multiple times
   *
   * @param userId - The user ID to check
   * @param courseIds - Array of course IDs to check
   * @returns Promise<Map<string, boolean>> - Map of courseId to enrollment status
   */
  async areEnrolled(userId: string, courseIds: string[]): Promise<Map<string, boolean>> {
    const enrollmentMap = new Map<string, boolean>();

    if (courseIds.length === 0) {
      return enrollmentMap;
    }

    try {
      // Query all enrollments at once
      const enrollments = await prisma.enrollment.findMany({
        where: {
          student_id: userId,
          course_id: {
            in: courseIds,
          },
        },
        select: {
          course_id: true,
        },
      });

      const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));

      // Build map with all course IDs
      for (const courseId of courseIds) {
        enrollmentMap.set(courseId, enrolledCourseIds.has(courseId));
      }

      return enrollmentMap;
    } catch (error) {
      logger.error('Error checking multiple enrollment statuses:', error);
      throw new Error('Failed to check enrollment statuses');
    }
  }

  /**
   * Get all courses a user is enrolled in
   *
   * @param userId - The user ID
   * @returns Promise<string[]> - Array of course IDs
   */
  async getEnrolledCourses(userId: string): Promise<string[]> {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          student_id: userId,
        },
        select: {
          course_id: true,
        },
      });

      return enrollments.map(e => e.course_id);
    } catch (error) {
      logger.error('Error getting enrolled courses:', error);
      throw new Error('Failed to get enrolled courses');
    }
  }
}

export const enrollmentService = new EnrollmentService();
