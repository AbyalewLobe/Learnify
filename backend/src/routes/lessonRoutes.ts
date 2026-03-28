import { Router, Response, NextFunction } from 'express';
import {
  createLesson,
  updateLesson,
  deleteLesson,
  getLesson,
  reorderLessons,
  duplicateLesson,
  moveLesson,
} from '../controllers/lessonController';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { authorizeOwnership } from '../middleware/authorizeOwnership';
import { prisma } from '../config/prisma';

const router = Router();

/**
 * Middleware to verify course ownership through chapter
 * Used for lesson creation and chapter lesson reordering
 */
const verifyChapterOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chapterId } = req.params;

    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Admins have access to all resources
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Get chapter and verify course ownership
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: {
          select: { creator_id: true },
        },
      },
    });

    if (!chapter) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Chapter not found',
        },
      });
      return;
    }

    if (chapter.course.creator_id !== req.user.userId) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not own this course.',
        },
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/chapters/{chapterId}/lessons:
 *   post:
 *     summary: Create a new lesson in a chapter
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - lesson_type
 *             properties:
 *               title:
 *                 type: string
 *                 example: Understanding useState Hook
 *               description:
 *                 type: string
 *                 example: Learn how to use the useState hook
 *               lesson_type:
 *                 type: string
 *                 enum: [video, quiz, reading, assignment]
 *                 example: video
 *               content:
 *                 type: object
 *                 description: Type-specific content (video_id, questions, etc.)
 *               duration_minutes:
 *                 type: integer
 *                 example: 15
 *               is_preview:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Chapter not found
 */
router.post(
  '/chapters/:chapterId/lessons',
  authenticate,
  authorize('creator', 'admin'),
  verifyChapterOwnership,
  createLesson
);

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get lesson details by ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson details
 *       404:
 *         description: Lesson not found
 */
router.get('/lessons/:id', getLesson);

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               lesson_type:
 *                 type: string
 *                 enum: [video, quiz, reading, assignment]
 *               content:
 *                 type: object
 *               duration_minutes:
 *                 type: integer
 *               is_preview:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Lesson not found
 */
router.put(
  '/lessons/:id',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('lesson'),
  updateLesson
);

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson ID
 *     responses:
 *       204:
 *         description: Lesson deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Lesson not found
 */
router.delete(
  '/lessons/:id',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('lesson'),
  deleteLesson
);

/**
 * @swagger
 * /api/chapters/{chapterId}/lessons/reorder:
 *   patch:
 *     summary: Reorder lessons in a chapter
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonIds
 *             properties:
 *               lessonIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["uuid1", "uuid2", "uuid3"]
 *     responses:
 *       200:
 *         description: Lessons reordered successfully
 *       400:
 *         description: Validation error or invalid lesson IDs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 */
router.patch(
  '/chapters/:chapterId/lessons/reorder',
  authenticate,
  authorize('creator', 'admin'),
  verifyChapterOwnership,
  reorderLessons
);

/**
 * @swagger
 * /api/lessons/{id}/duplicate:
 *   post:
 *     summary: Duplicate a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson ID
 *     responses:
 *       201:
 *         description: Lesson duplicated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Lesson not found
 */
router.post(
  '/lessons/:id/duplicate',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('lesson'),
  duplicateLesson
);

/**
 * @swagger
 * /api/lessons/{id}/move:
 *   patch:
 *     summary: Move a lesson to a different chapter
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetChapterId
 *             properties:
 *               targetChapterId:
 *                 type: string
 *                 format: uuid
 *                 example: "uuid-of-target-chapter"
 *     responses:
 *       200:
 *         description: Lesson moved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Lesson or target chapter not found
 */
router.patch(
  '/lessons/:id/move',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('lesson'),
  moveLesson
);

export default router;
