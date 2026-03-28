import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/CourseService';
import { validateCourseCreation, validateCourseUpdate } from '../utils/validation';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/authenticate';

const courseService = new CourseService();

export const createCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateCourseCreation(req.body);
    if (error) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details,
        },
      });
      return;
    }

    const courseData = {
      ...value,
      creator_id: req.user!.userId,
    };

    const thumbnailFile = req.file;
    const course = await courseService.createCourse(courseData, thumbnailFile);

    // Handle tags if provided
    if (value.tags && value.tags.length > 0) {
      await courseService.manageTags(course.id, value.tags, []);
    }

    res.status(201).json(course);
  } catch (error) {
    logger.error('Error creating course:', error);
    next(error);
  }
};

export const updateCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = validateCourseUpdate(req.body);
    if (error) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details,
        },
      });
      return;
    }

    const thumbnailFile = req.file;
    const course = await courseService.updateCourse(id, value, thumbnailFile);

    // Handle tags if provided
    if (value.tags) {
      const currentTags = await courseService.manageTags(course.id, [], []);
      await courseService.manageTags(course.id, value.tags, currentTags);
    }

    res.json(course);
  } catch (error) {
    logger.error('Error updating course:', error);
    if (error instanceof Error && error.message === 'Course not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const deleteCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await courseService.deleteCourse(id);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting course:', error);
    if (error instanceof Error) {
      if (error.message === 'Course not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Course not found',
          },
        });
        return;
      }
      if (error.message === 'Only draft courses can be deleted') {
        res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: 'Only draft courses can be deleted',
          },
        });
        return;
      }
    }
    next(error);
  }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourse(id);

    res.json(course);
  } catch (error) {
    logger.error('Error getting course:', error);
    if (error instanceof Error && error.message === 'Course not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await courseService.listPublishedCourses(page, limit);
    

    res.json({
      courses: result.courses,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error listing courses:', error);
    next(error);
  }
};

export const listMyCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await courseService.listCreatorCourses(req.user!.userId, page, limit);

    res.json({
      courses: result.courses,
      pagination: {
        page,
        limit,
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error listing creator courses:', error);
    next(error);
  }
};

export const submitCourseForReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await courseService.submitForReview(id);

    res.json(course);
  } catch (error) {
    logger.error('Error submitting course for review:', error);
    if (error instanceof Error) {
      if (error.message === 'Course not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Course not found',
          },
        });
        return;
      }
      if (
        error.message.includes('Only draft courses') ||
        error.message.includes('must have at least')
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: error.message,
          },
        });
        return;
      }
    }
    next(error);
  }
};
