import { VideoRepository } from '../repositories/VideoRepository';
import { Video, VideoStatus } from '@prisma/client';
import { S3Service, CloudFrontService } from '../config/aws';
import { MockS3Service } from './MockS3Service';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Use mock S3 in development if AWS endpoint is set to localhost
const useMockS3 = config.aws.endpoint?.includes('localhost') || config.nodeEnv === 'development';
const S3 = useMockS3 ? MockS3Service : S3Service;

export class VideoService {
  private videoRepository: VideoRepository;

  constructor() {
    this.videoRepository = new VideoRepository();
  }

  async initiateUpload(
    uploaderId: string,
    filename: string,
    contentType: string,
    fileSizeBytes: number
  ): Promise<{ videoId: string; uploadUrl: string }> {
    // Validate file size (max 2GB)
    const maxSizeBytes = config.fileUpload.maxVideoSizeMB * 1024 * 1024;
    if (fileSizeBytes > maxSizeBytes) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.fileUpload.maxVideoSizeMB}MB`
      );
    }

    // Validate content type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(contentType)) {
      throw new Error('Invalid video format. Allowed formats: MP4, MOV, AVI, WebM');
    }

    // Generate unique video ID and S3 key
    const videoId = uuidv4();
    const s3Key = `originals/${videoId}/${filename}`;

    // Create video record with pending status
    await this.videoRepository.create({
      id: videoId,
      uploader: { connect: { id: uploaderId } },
      original_filename: filename,
      s3_key: s3Key,
      status: VideoStatus.pending,
    });

    // Generate presigned upload URL (1 hour expiration)
    const uploadUrl = await S3.getUploadUrl(config.aws.s3.buckets.videos, s3Key, contentType, 3600);

    return { videoId, uploadUrl };
  }

  async confirmUpload(videoId: string): Promise<Video> {
    const video = await this.videoRepository.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.status !== VideoStatus.pending) {
      throw new Error('Video is not in pending status');
    }

    // Verify file exists in S3
    const fileExists = await S3.fileExists(config.aws.s3.buckets.videos, video.s3_key);
    if (!fileExists) {
      throw new Error('Video file not found in S3. Upload may have failed.');
    }

    // Update status to processing
    const updatedVideo = await this.videoRepository.updateStatus(videoId, VideoStatus.processing);

    // TODO: Enqueue transcoding job to message queue
    // For now, we'll handle transcoding synchronously or via a separate worker

    return updatedVideo;
  }

  async getVideoStatus(videoId: string): Promise<Video> {
    const video = await this.videoRepository.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    return video;
  }

  async generateStreamingUrl(videoId: string): Promise<string> {
    const video = await this.videoRepository.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.status !== VideoStatus.ready) {
      throw new Error('Video is not ready for streaming');
    }

    // Generate CloudFront signed URL for HLS playlist (1 hour expiration)
    const hlsPlaylistKey = `transcoded/${videoId}/playlist.m3u8`;
    const cloudfrontUrl = `https://${config.aws.cloudfront.domain}/${hlsPlaylistKey}`;

    const signedUrl = CloudFrontService.getSignedUrl(cloudfrontUrl, 3600);

    return signedUrl;
  }

  async deleteVideo(videoId: string, requesterId: string): Promise<void> {
    const video = await this.videoRepository.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Verify ownership (uploader or admin)
    if (video.uploader_id !== requesterId) {
      throw new Error('Access denied. You do not own this video.');
    }

    // Delete from S3
    try {
      // Delete original
      await S3.deleteFile(config.aws.s3.buckets.videos, video.s3_key);

      // Delete transcoded files (if they exist)
      if (video.status === VideoStatus.ready && video.resolutions) {
        const resolutions = video.resolutions as any;
        for (const resolution of Object.keys(resolutions)) {
          const transcodedKey = `transcoded/${videoId}/${resolution}.m3u8`;
          await S3.deleteFile(config.aws.s3.buckets.videos, transcodedKey);
        }
      }
    } catch (error) {
      // Log error but continue with database deletion
      logger.error('Error deleting video files from S3:', error);
    }

    // Delete from database
    await this.videoRepository.delete(videoId);
  }
}
