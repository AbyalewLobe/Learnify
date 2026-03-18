import { pool } from '../config/database';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';

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
      const result = await pool.query(
        `SELECT EXISTS(
          SELECT 1 FROM enrollments 
          WHERE student_id = $1 AND course_id = $2
        ) as is_enrolled`,
        [userId, courseId]
      );

      const isEnrolled = result.rows[0]?.is_enrolled || false;

      // Cache the result
      try {
        await redisClient.setex(
          cacheKey,
          this.CACHE_TTL,
          isEnrolled ? '1' : '0'
        );
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
      logger.debug(
        `Enrollment cache invalidated for user ${userId} in course ${courseId}`
      );
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
  async areEnrolled(
    userId: string,
    courseIds: string[]
  ): Promise<Map<string, boolean>> {
    const enrollmentMap = new Map<string, boolean>();

    if (courseIds.length === 0) {
      return enrollmentMap;
    }

    try {
      // Query all enrollments at once
      const result = await pool.query(
        `SELECT course_id FROM enrollments 
         WHERE student_id = $1 AND course_id = ANY($2)`,
        [userId, courseIds]
      );

      const enrolledCourseIds = new Set(
        result.rows.map((row) => row.course_id)
      );

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
      const result = await pool.query(
        'SELECT course_id FROM enrollments WHERE student_id = $1',
        [userId]
      );

      return result.rows.map((row) => row.course_id);
    } catch (error) {
      logger.error('Error getting enrolled courses:', error);
      throw new Error('Failed to get enrolled courses');
    }
  }
}

export const enrollmentService = new EnrollmentService();
