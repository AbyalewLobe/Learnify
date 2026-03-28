import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mock S3 Service for local development without AWS
 * Stores files in local filesystem instead of S3
 */
export class MockS3Service {
  private static storageDir = path.join(__dirname, '../../mock-s3-storage');

  // Initialize storage directory
  static initialize(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      logger.info('Mock S3 storage directory created', { path: this.storageDir });
    }
  }

  // Generate mock presigned URL for upload
  static async getUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    _expiresIn: number = 3600
  ): Promise<string> {
    this.initialize();

    // Return a mock URL that points to our API
    const mockUrl = `http://localhost:3001/api/v1/mock-s3/upload?bucket=${bucket}&key=${encodeURIComponent(key)}`;

    logger.debug('Generated mock S3 upload URL', { bucket, key, contentType });
    return mockUrl;
  }

  // Generate mock presigned URL for download
  static async getDownloadUrl(
    bucket: string,
    key: string,
    _expiresIn: number = 3600
  ): Promise<string> {
    const mockUrl = `http://localhost:3001/api/v1/mock-s3/download?bucket=${bucket}&key=${encodeURIComponent(key)}`;

    logger.debug('Generated mock S3 download URL', { bucket, key });
    return mockUrl;
  }

  // Upload file to mock storage
  static async uploadFile(
    bucket: string,
    key: string,
    body: Buffer | string,
    _contentType: string,
    _metadata?: Record<string, string>
  ): Promise<any> {
    this.initialize();

    const filePath = path.join(this.storageDir, bucket, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, body);

    logger.info('File uploaded to mock S3', { bucket, key, size: body.length });
    return { Location: filePath, Bucket: bucket, Key: key };
  }

  // Delete file from mock storage
  static async deleteFile(bucket: string, key: string): Promise<void> {
    const filePath = path.join(this.storageDir, bucket, key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted from mock S3', { bucket, key });
    }
  }

  // Check if file exists
  static async fileExists(bucket: string, key: string): Promise<boolean> {
    const filePath = path.join(this.storageDir, bucket, key);
    return fs.existsSync(filePath);
  }

  // Copy file within mock storage
  static async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<void> {
    const sourcePath = path.join(this.storageDir, sourceBucket, sourceKey);
    const destPath = path.join(this.storageDir, destBucket, destKey);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);
    logger.info('File copied in mock S3', { sourceBucket, sourceKey, destBucket, destKey });
  }
}
