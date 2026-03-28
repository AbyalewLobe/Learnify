import { Response, NextFunction } from 'express';
import { VideoService } from '../services/VideoService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/authenticate';
import Joi from 'joi';

const videoService = new VideoService();

// Validation schemas
const initiateUploadSchema = Joi.object({
  filename: Joi.string().min(1).max(255).required(),
  contentType: Joi.string()
    .valid('video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm')
    .required(),
  fileSizeBytes: Joi.number().integer().min(1).required(),
});

export const initiateVideoUpload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = initiateUploadSchema.validate(req.body);

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

    const result = await videoService.initiateUpload(
      req.user!.userId,
      value.filename,
      value.contentType,
      value.fileSizeBytes
    );

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error initiating video upload:', error);
    if (error instanceof Error && error.message.includes('exceeds maximum')) {
      res.status(400).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: error.message,
        },
      });
      return;
    }
    if (error instanceof Error && error.message.includes('Invalid video format')) {
      res.status(400).json({
        error: {
          code: 'INVALID_FORMAT',
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
};

export const confirmVideoUpload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await videoService.confirmUpload(id);

    res.json(video);
  } catch (error) {
    logger.error('Error confirming video upload:', error);
    if (error instanceof Error) {
      if (error.message === 'Video not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Video not found',
          },
        });
        return;
      }
      if (
        error.message?.includes('not in pending status') ||
        error.message?.includes('not found in S3')
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
    // Handle AWS S3 errors
    if ((error as any).code === 'Forbidden' || (error as any).statusCode === 403) {
      res.status(500).json({
        error: {
          code: 'S3_ACCESS_ERROR',
          message:
            'Unable to access S3 bucket. Please check AWS credentials and bucket permissions.',
        },
      });
      return;
    }
    next(error);
  }
};

export const getVideoStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await videoService.getVideoStatus(id);

    res.json({
      id: video.id,
      status: video.status,
      duration_seconds: video.duration_seconds,
      resolutions: video.resolutions,
      error_message: video.error_message,
      created_at: video.created_at,
      updated_at: video.updated_at,
    });
  } catch (error) {
    logger.error('Error getting video status:', error);
    if (error instanceof Error && error.message === 'Video not found') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Video not found',
        },
      });
      return;
    }
    next(error);
  }
};

export const getStreamingUrl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // TODO: Verify user enrollment in course containing the video
    // TODO: Allow access to preview videos without enrollment

    const streamingUrl = await videoService.generateStreamingUrl(id);

    res.json({ streamingUrl });
  } catch (error) {
    logger.error('Error generating streaming URL:', error);
    if (error instanceof Error) {
      if (error.message === 'Video not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Video not found',
          },
        });
        return;
      }
      if (error.message.includes('not ready for streaming')) {
        res.status(400).json({
          error: {
            code: 'VIDEO_NOT_READY',
            message: error.message,
          },
        });
        return;
      }
    }
    next(error);
  }
};

export const deleteVideo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await videoService.deleteVideo(id, req.user!.userId);

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting video:', error);
    if (error instanceof Error) {
      if (error.message === 'Video not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Video not found',
          },
        });
        return;
      }
      if (error.message.includes('Access denied')) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
        return;
      }
    }
    next(error);
  }
};

export const updateVideoPosition = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { positionSeconds } = req.body;

    if (typeof positionSeconds !== 'number' || positionSeconds < 0) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'positionSeconds must be a non-negative number',
        },
      });
      return;
    }

    // TODO: Get lesson ID from video ID and update progress
    // For now, this is a placeholder
    res.json({ message: 'Video position updated', positionSeconds });
  } catch (error) {
    logger.error('Error updating video position:', error);
    next(error);
  }
};

export const getVideoPosition = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // TODO: Get lesson ID from video ID and retrieve progress
    // For now, this is a placeholder
    res.json({ videoId: id, positionSeconds: 0 });
  } catch (error) {
    logger.error('Error getting video position:', error);
    next(error);
  }
};
