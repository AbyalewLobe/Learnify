import { S3Service } from '../config/aws';
import { config } from '../config/env';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadResult {
  fileId: string;
  uploadUrl: string;
  downloadUrl?: string;
  bucket: string;
  key: string;
}

export class FileUploadService {
  // Generate upload URL for videos
  static async generateVideoUploadUrl(
    originalFilename: string,
    contentType: string
  ): Promise<FileUploadResult> {
    const fileId = uuidv4();
    const fileExtension = originalFilename.split('.').pop() || 'mp4';
    const key = `originals/${fileId}/original.${fileExtension}`;
    const bucket = config.aws.s3.buckets.videos;

    try {
      const uploadUrl = await S3Service.getUploadUrl(bucket, key, contentType);

      return {
        fileId,
        uploadUrl,
        bucket,
        key,
      };
    } catch (error) {
      logger.error('Failed to generate video upload URL:', {
        originalFilename,
        contentType,
        error,
      });
      throw error;
    }
  }

  // Generate upload URL for resources (PDFs, ZIPs, etc.)
  static async generateResourceUploadUrl(
    lessonId: string,
    originalFilename: string,
    contentType: string
  ): Promise<FileUploadResult> {
    const fileId = uuidv4();
    const fileExtension = originalFilename.split('.').pop() || 'bin';
    const key = `lessons/${lessonId}/resources/${fileId}.${fileExtension}`;
    const bucket = config.aws.s3.buckets.resources;

    try {
      const uploadUrl = await S3Service.getUploadUrl(bucket, key, contentType);

      return {
        fileId,
        uploadUrl,
        bucket,
        key,
      };
    } catch (error) {
      logger.error('Failed to generate resource upload URL:', {
        lessonId,
        originalFilename,
        contentType,
        error,
      });
      throw error;
    }
  }

  // Generate upload URL for public assets (thumbnails, profile images)
  static async generatePublicUploadUrl(
    type: 'thumbnail' | 'profile' | 'certificate',
    entityId: string,
    originalFilename: string,
    contentType: string
  ): Promise<FileUploadResult> {
    const fileId = uuidv4();
    const fileExtension = originalFilename.split('.').pop() || 'jpg';
    const key = `${type}s/${entityId}/${fileId}.${fileExtension}`;
    const bucket = config.aws.s3.buckets.public;

    try {
      const uploadUrl = await S3Service.getUploadUrl(bucket, key, contentType);
      const downloadUrl = `https://${bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;

      return {
        fileId,
        uploadUrl,
        downloadUrl,
        bucket,
        key,
      };
    } catch (error) {
      logger.error('Failed to generate public upload URL:', {
        type,
        entityId,
        originalFilename,
        contentType,
        error,
      });
      throw error;
    }
  }

  // Generate upload URL for temporary uploads
  static async generateTempUploadUrl(
    originalFilename: string,
    contentType: string
  ): Promise<FileUploadResult> {
    const fileId = uuidv4();
    const fileExtension = originalFilename.split('.').pop() || 'bin';
    const key = `temp/${fileId}.${fileExtension}`;
    const bucket = config.aws.s3.buckets.uploads;

    try {
      const uploadUrl = await S3Service.getUploadUrl(bucket, key, contentType, 1800); // 30 minutes

      return {
        fileId,
        uploadUrl,
        bucket,
        key,
      };
    } catch (error) {
      logger.error('Failed to generate temp upload URL:', { originalFilename, contentType, error });
      throw error;
    }
  }

  // Validate file type and size
  static validateFile(
    contentType: string,
    fileSize: number,
    allowedTypes: string[],
    maxSizeMB: number
  ): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `File type ${contentType} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      return {
        valid: false,
        error: `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  // Get allowed file types for different upload types
  static getAllowedTypes(uploadType: 'video' | 'resource' | 'image'): string[] {
    switch (uploadType) {
      case 'video':
        return ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];
      case 'resource':
        return [
          'application/pdf',
          'application/zip',
          'application/x-zip-compressed',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ];
      case 'image':
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      default:
        return [];
    }
  }

  // Get max file size for different upload types
  static getMaxFileSize(uploadType: 'video' | 'resource' | 'image'): number {
    switch (uploadType) {
      case 'video':
        return config.fileUpload.maxVideoSizeMB;
      case 'resource':
        return config.fileUpload.maxResourceSizeMB;
      case 'image':
        return config.fileUpload.maxImageSizeMB;
      default:
        return 10; // Default 10MB
    }
  }
}
