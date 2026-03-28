import { Router } from 'express';
import {
  initiateVideoUpload,
  confirmVideoUpload,
  getVideoStatus,
  getStreamingUrl,
  deleteVideo,
  updateVideoPosition,
  getVideoPosition,
} from '../controllers/videoController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Initiate video upload
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *               - fileSizeBytes
 *             properties:
 *               filename:
 *                 type: string
 *                 example: my-video.mp4
 *               contentType:
 *                 type: string
 *                 enum: [video/mp4, video/quicktime, video/x-msvideo, video/webm]
 *                 example: video/mp4
 *               fileSizeBytes:
 *                 type: integer
 *                 example: 104857600
 *     responses:
 *       201:
 *         description: Upload initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: string
 *                   format: uuid
 *                 uploadUrl:
 *                   type: string
 *                   description: Presigned S3 URL for direct upload
 *       400:
 *         description: Validation error or file too large
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires creator or admin role
 */
router.post('/videos/upload', authenticate, authorize('creator', 'admin'), initiateVideoUpload);

/**
 * @swagger
 * /api/videos/{id}/confirm:
 *   post:
 *     summary: Confirm video upload and trigger transcoding
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Upload confirmed, transcoding started
 *       400:
 *         description: Video not in pending status or file not found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 */
router.post('/videos/:id/confirm', authenticate, authorize('creator', 'admin'), confirmVideoUpload);

/**
 * @swagger
 * /api/videos/{id}/status:
 *   get:
 *     summary: Get video processing status
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, ready, failed]
 *                 duration_seconds:
 *                   type: integer
 *                 resolutions:
 *                   type: object
 *                 error_message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 */
router.get('/videos/:id/status', authenticate, getVideoStatus);

/**
 * @swagger
 * /api/videos/{id}/stream:
 *   get:
 *     summary: Get video streaming URL
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Streaming URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streamingUrl:
 *                   type: string
 *                   description: CloudFront signed URL for HLS streaming
 *       400:
 *         description: Video not ready for streaming
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not enrolled in course
 *       404:
 *         description: Video not found
 */
router.get('/videos/:id/stream', authenticate, getStreamingUrl);

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       204:
 *         description: Video deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the video owner
 *       404:
 *         description: Video not found
 */
router.delete('/videos/:id', authenticate, authorize('creator', 'admin'), deleteVideo);

/**
 * @swagger
 * /api/videos/{id}/position:
 *   patch:
 *     summary: Update video playback position
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - positionSeconds
 *             properties:
 *               positionSeconds:
 *                 type: integer
 *                 example: 120
 *     responses:
 *       200:
 *         description: Position updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch('/videos/:id/position', authenticate, updateVideoPosition);

/**
 * @swagger
 * /api/videos/{id}/position:
 *   get:
 *     summary: Get video playback position
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Current playback position
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: string
 *                   format: uuid
 *                 positionSeconds:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/videos/:id/position', authenticate, getVideoPosition);

export default router;
