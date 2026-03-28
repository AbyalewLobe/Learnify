import { Router, Request, Response } from 'express';
import { MockS3Service } from '../services/MockS3Service';
import multer from 'multer';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Mock S3 upload endpoint for local development
 * Simulates S3 presigned URL upload
 */
router.put('/mock-s3/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { bucket, key } = req.query;

    if (!bucket || !key) {
      res.status(400).json({ error: 'Missing bucket or key parameter' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    await MockS3Service.uploadFile(
      bucket as string,
      key as string,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(200).send('File uploaded successfully');
  } catch (error) {
    logger.error('Mock S3 upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * Mock S3 download endpoint for local development
 */
router.get('/mock-s3/download', async (req: Request, res: Response) => {
  try {
    const { bucket, key } = req.query;

    if (!bucket || !key) {
      res.status(400).json({ error: 'Missing bucket or key parameter' });
      return;
    }

    const filePath = require('path').join(
      MockS3Service['storageDir'],
      bucket as string,
      key as string
    );

    if (!require('fs').existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.sendFile(filePath);
  } catch (error) {
    logger.error('Mock S3 download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
