import { Response, NextFunction } from 'express';
import { ChapterService } from '../services/ChapterService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/authenticate';
import Joi from 'joi';

const chapterService = new ChapterService();

// Validation schemas
const createChapterSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).optional().allow(''),
});

const updateChapterSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(5000).optional().allow(''),
});

const reorderChaptersSchema = Joi.object({
  chapterIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const createChapter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { error, value } = createChapterSchema.validate(req.body);

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

    const chapter = await chapterService.createChapter(courseId, value);

    res.status(201).json(chapter);
  } catch (error) {
    logger.error('Error creating chapter:', error);
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

export const updateChapter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { error, value } = updateChapterSchema.validate(req.body);

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

    const chapter = await chapterService.updateChapter(id, value);

    res.json(chapter);
  } catch (error) {
    logger.error('Error updating chapter:', error);
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

export const deleteChapter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await chapterService.deleteChapter(id);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting chapter:', error);
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

export const getChapter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const chapter = await chapterService.getChapter(id);

    res.json(chapter);
  } catch (error) {
    logger.error('Error getting chapter:', error);
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

export const reorderChapters = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { error, value } = reorderChaptersSchema.validate(req.body);

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

    await chapterService.reorderChapters(courseId, value.chapterIds);

    res.json({ message: 'Chapters reordered successfully' });
  } catch (error) {
    logger.error('Error reordering chapters:', error);
    if (error instanceof Error) {
      if (
        error.message.includes('do not belong to this course') ||
        error.message.includes('All chapters must be included')
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
