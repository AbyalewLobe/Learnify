import { Router } from 'express';
import {
  createChapter,
  updateChapter,
  deleteChapter,
  getChapter,
  reorderChapters,
} from '../controllers/chapterController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { authorizeOwnership } from '../middleware/authorizeOwnership';

const router = Router();

/**
 * @swagger
 * /api/courses/{courseId}/chapters:
 *   post:
 *     summary: Create a new chapter in a course
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introduction to React Hooks
 *               description:
 *                 type: string
 *                 example: Learn the fundamentals of React Hooks
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Course not found
 */
router.post(
  '/courses/:courseId/chapters',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('course'),
  createChapter
);

/**
 * @swagger
 * /api/chapters/{id}:
 *   get:
 *     summary: Get chapter details by ID
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter details with lessons
 *       404:
 *         description: Chapter not found
 */
router.get('/chapters/:id', getChapter);

/**
 * @swagger
 * /api/chapters/{id}:
 *   put:
 *     summary: Update a chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: Advanced React Hooks
 *               description:
 *                 type: string
 *                 example: Deep dive into custom hooks
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Chapter not found
 */
router.put(
  '/chapters/:id',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('chapter'),
  updateChapter
);

/**
 * @swagger
 * /api/chapters/{id}:
 *   delete:
 *     summary: Delete a chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chapter ID
 *     responses:
 *       204:
 *         description: Chapter deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 *       404:
 *         description: Chapter not found
 */
router.delete(
  '/chapters/:id',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('chapter'),
  deleteChapter
);

/**
 * @swagger
 * /api/courses/{courseId}/chapters/reorder:
 *   patch:
 *     summary: Reorder chapters in a course
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chapterIds
 *             properties:
 *               chapterIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["uuid1", "uuid2", "uuid3"]
 *     responses:
 *       200:
 *         description: Chapters reordered successfully
 *       400:
 *         description: Validation error or invalid chapter IDs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the course owner
 */
router.patch(
  '/courses/:courseId/chapters/reorder',
  authenticate,
  authorize('creator', 'admin'),
  authorizeOwnership('course'),
  reorderChapters
);

export default router;
