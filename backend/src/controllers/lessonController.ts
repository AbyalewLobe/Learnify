import { Response, NextFunction } from 'express';
import { LessonService } from '../services/LessonService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/authenticate';
import Joi from 'joi';

const lessonService = new LessonService();

// Validation schemas
const createLessonSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).optional().allow(''),
  lesson_type: Joi.string().valid('video', 'quiz', 'reading', 'assignment').required(),
  content: Joi.object().optional(),
  duration_minutes: Joi.number().integer().min(0).optional(),
  is_preview: Joi.boolean().optional(),
});

const updateLessonSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(5000).optional().allow(''),
  lesson_type: Joi.string().valid('video', 'quiz', 'reading', 'assignment').optional(),
  content: Joi.object().optional(),
  duration_minutes: Joi.number().integer().min(0).optional(),
  is_preview: Joi.boolean().optional(),
});

const reorderLessonsSchema = Joi.object({
  lessonIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const moveLessonSchema = Joi.object({
  targetChapterId: Joi.string().uuid().required(),
});

export const createLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chapterId } = req.params;
    const { error, value } = createLessonSchema.validate(req.body);

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

    const lesson = await lessonService.createLesson(chapterId, value);

    res.status(201).json(lesson);
  } catch (error) {
    logger.error('Error creating lesson:', error);
    if (error instanceof Error && error.message === 'Chapter not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Chapter not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const updateLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateLessonSchema.validate(req.body);

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

    const lesson = await lessonService.updateLesson(id, value);

    res.json(lesson);
  } catch (error) {
    logger.error('Error updating lesson:', error);
    if (error instanceof Error && error.message === 'Lesson not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const deleteLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await lessonService.deleteLesson(id);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting lesson:', error);
    if (error instanceof Error && error.message === 'Lesson not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const getLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lesson = await lessonService.getLesson(id);

    res.json(lesson);
  } catch (error) {
    logger.error('Error getting lesson:', error);
    if (error instanceof Error && error.message === 'Lesson not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const reorderLessons = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chapterId } = req.params;
    const { error, value } = reorderLessonsSchema.validate(req.body);

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

    await lessonService.reorderLessons(chapterId, value.lessonIds);

    res.json({ message: 'Lessons reordered successfully' });
  } catch (error) {
    logger.error('Error reordering lessons:', error);
    if (error instanceof Error) {
      if (
        error.message.includes('do not belong to this chapter') ||
        error.message.includes('All lessons must be included')
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

export const duplicateLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lesson = await lessonService.duplicateLesson(id);

    res.status(201).json(lesson);
  } catch (error) {
    logger.error('Error duplicating lesson:', error);
    if (error instanceof Error && error.message === 'Lesson not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const moveLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = moveLessonSchema.validate(req.body);

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

    const lesson = await lessonService.moveLesson(id, value.targetChapterId);

    res.json(lesson);
  } catch (error) {
    logger.error('Error moving lesson:', error);
    if (error instanceof Error) {
      if (error.message === 'Lesson not found' || error.message === 'Target chapter not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }
    }
    next(error);
  }
};
