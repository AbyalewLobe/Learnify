import {
  CourseRepository,
  CreateCourseData,
  UpdateCourseData,
  Course,
} from '../repositories/CourseRepository';
import { uploadToS3, deleteFromS3 } from '../utils/fileUpload';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

export class CourseService {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  async createCourse(data: CreateCourseData, thumbnailFile?: Express.Multer.File): Promise<Course> {
    let thumbnailUrl: string | undefined;

    // Upload thumbnail to S3 if provided
    if (thumbnailFile) {
      try {
        thumbnailUrl = await uploadToS3(thumbnailFile, 'thumbnails');
      } catch (error) {
        logger.error('Failed to upload thumbnail:', error);
        throw new Error('Failed to upload thumbnail');
      }
    }

    const courseData = {
      ...data,
      thumbnail_url: thumbnailUrl,
    };

    const course = await this.courseRepository.create(courseData);
    logger.info(`Course created: ${course.id} by creator: ${data.creator_id}`);

    return course;
  }

  async updateCourse(
    courseId: string,
    data: UpdateCourseData,
    thumbnailFile?: Express.Multer.File
  ): Promise<Course> {
    const existingCourse = await this.courseRepository.findById(courseId);
    if (!existingCourse) {
      throw new Error('Course not found');
    }

    let thumbnailUrl: string | undefined;

    // Upload new thumbnail if provided
    if (thumbnailFile) {
      try {
        thumbnailUrl = await uploadToS3(thumbnailFile, 'thumbnails');

        // Delete old thumbnail if exists
        if (existingCourse.thumbnail_url) {
          await deleteFromS3(existingCourse.thumbnail_url).catch(err =>
            logger.warn('Failed to delete old thumbnail:', err)
          );
        }
      } catch (error) {
        logger.error('Failed to upload thumbnail:', error);
        throw new Error('Failed to upload thumbnail');
      }
    }

    const updateData = {
      ...data,
      ...(thumbnailUrl && { thumbnail_url: thumbnailUrl }),
    };

    const updatedCourse = await this.courseRepository.update(courseId, updateData);
    if (!updatedCourse) {
      throw new Error('Failed to update course');
    }

    // Invalidate cache
    await this.invalidateCourseCache(courseId);

    logger.info(`Course updated: ${courseId}`);
    return updatedCourse;
  }

  async deleteCourse(courseId: string): Promise<void> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.status !== 'draft') {
      throw new Error('Only draft courses can be deleted');
    }

    // Delete thumbnail from S3 if exists
    if (course.thumbnail_url) {
      await deleteFromS3(course.thumbnail_url).catch(err =>
        logger.warn('Failed to delete thumbnail:', err)
      );
    }

    const deleted = await this.courseRepository.delete(courseId);
    if (!deleted) {
      throw new Error('Failed to delete course');
    }

    // Invalidate cache
    await this.invalidateCourseCache(courseId);

    logger.info(`Course deleted: ${courseId}`);
  }

  async getCourse(courseId: string): Promise<any> {
    // Try to get from cache first
    const cacheKey = `course:${courseId}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read failed:', error);
    }

    const course = await this.courseRepository.findByIdWithDetails(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Cache for 10 minutes
    try {
      await redisClient.set(cacheKey, JSON.stringify(course), { EX: 600 });
    } catch (error) {
      logger.warn('Redis cache write failed:', error);
    }

    return course;
  }

  async listPublishedCourses(
    page: number = 1,
    limit: number = 20
  ): Promise<{ courses: Course[]; total: number }> {
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    // Try to get from cache
    const cacheKey = `courses:list:published:${page}:${limit}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read failed:', error);
    }

    const courses = await this.courseRepository.findPublished(limit, offset);

    const result = {
      courses,
      total: courses.length, // In production, you'd want a separate count query
    };

    // Cache for 5 minutes
    try {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });
    } catch (error) {
      logger.warn('Redis cache write failed:', error);
    }

    return result;
  }

  async listCreatorCourses(
    creatorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ courses: Course[]; total: number }> {
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const courses = await this.courseRepository.findByCreator(creatorId, limit, offset);

    return {
      courses,
      total: courses.length,
    };
  }

  async submitForReview(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.status !== 'draft') {
      throw new Error('Only draft courses can be submitted for review');
    }

    // Validate course has content
    const hasContent = await this.courseRepository.hasChaptersAndLessons(courseId);
    if (!hasContent) {
      throw new Error('Course must have at least one chapter and one lesson');
    }

    const updatedCourse = await this.courseRepository.updateStatus(courseId, 'pending');
    if (!updatedCourse) {
      throw new Error('Failed to submit course for review');
    }

    // TODO: Create notification for admins

    logger.info(`Course submitted for review: ${courseId}`);
    return updatedCourse;
  }

  async manageTags(
    courseId: string,
    tagsToAdd: string[],
    tagsToRemove: string[]
  ): Promise<string[]> {
    // Validate tag format
    const tagRegex = /^[a-zA-Z0-9-]+$/;
    const invalidTags = [...tagsToAdd, ...tagsToRemove].filter(
      tag => tag.length > 50 || !tagRegex.test(tag)
    );

    if (invalidTags.length > 0) {
      throw new Error(
        'Invalid tag format. Tags must be alphanumeric with hyphens and max 50 characters'
      );
    }

    if (tagsToRemove.length > 0) {
      await this.courseRepository.removeTags(courseId, tagsToRemove);
    }

    if (tagsToAdd.length > 0) {
      await this.courseRepository.addTags(courseId, tagsToAdd);
    }

    // Invalidate cache
    await this.invalidateCourseCache(courseId);

    return this.courseRepository.getTags(courseId);
  }

  private async invalidateCourseCache(courseId: string): Promise<void> {
    try {
      await redisClient.del(`course:${courseId}`);
      // Also invalidate list caches (in production, you'd want a more sophisticated approach)
      // For now, we'll just delete the specific course cache
    } catch (error) {
      logger.warn('Failed to invalidate cache:', error);
    }
  }
}
