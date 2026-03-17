import AWS from 'aws-sdk';
import { config } from './env';
import { logger } from '../utils/logger';

// Configure AWS SDK
AWS.config.update({
  region: config.aws.region,
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

// S3 Configuration
export const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
});

// CloudFront Configuration
export const cloudfront = new AWS.CloudFront({
  apiVersion: '2020-05-31',
});

// SES Configuration
export const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: config.aws.ses.region,
});

// MediaConvert Configuration
let mediaConvert: AWS.MediaConvert | null = null;

const initializeMediaConvert = async (): Promise<AWS.MediaConvert> => {
  if (mediaConvert) return mediaConvert;

  try {
    // Create MediaConvert client with endpoint
    mediaConvert = new AWS.MediaConvert({
      apiVersion: '2017-08-29',
      endpoint: config.aws.mediaConvert.endpoint,
    });

    logger.info('MediaConvert client initialized');
    return mediaConvert;
  } catch (error) {
    logger.error('Failed to initialize MediaConvert client:', error);
    throw error;
  }
};

// S3 Helper Functions
export class S3Service {
  // Generate presigned URL for file upload
  static async getUploadUrl(
    bucket: string,
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise('putObject', params);
      logger.debug('Generated S3 upload URL', { bucket, key, contentType });
      return url;
    } catch (error) {
      logger.error('Failed to generate S3 upload URL:', { bucket, key, error });
      throw error;
    }
  }

  // Generate presigned URL for file download
  static async getDownloadUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
        Expires: expiresIn,
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      logger.debug('Generated S3 download URL', { bucket, key });
      return url;
    } catch (error) {
      logger.error('Failed to generate S3 download URL:', { bucket, key, error });
      throw error;
    }
  }

  // Upload file directly to S3
  static async uploadFile(
    bucket: string,
    key: string,
    body: Buffer | string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ...(metadata && { Metadata: metadata }),
      };

      const result = await s3.upload(params).promise();
      logger.info('File uploaded to S3', { bucket, key, location: result.Location });
      return result;
    } catch (error) {
      logger.error('Failed to upload file to S3:', { bucket, key, error });
      throw error;
    }
  }

  // Delete file from S3
  static async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
      };

      await s3.deleteObject(params).promise();
      logger.info('File deleted from S3', { bucket, key });
    } catch (error) {
      logger.error('Failed to delete file from S3:', { bucket, key, error });
      throw error;
    }
  }

  // Check if file exists in S3
  static async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      await s3.headObject({ Bucket: bucket, Key: key }).promise();
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      logger.error('Error checking file existence in S3:', { bucket, key, error });
      throw error;
    }
  }

  // Copy file within S3
  static async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<void> {
    try {
      const params = {
        Bucket: destBucket,
        CopySource: `${sourceBucket}/${sourceKey}`,
        Key: destKey,
      };

      await s3.copyObject(params).promise();
      logger.info('File copied in S3', { sourceBucket, sourceKey, destBucket, destKey });
    } catch (error) {
      logger.error('Failed to copy file in S3:', {
        sourceBucket,
        sourceKey,
        destBucket,
        destKey,
        error,
      });
      throw error;
    }
  }
}

// CloudFront Helper Functions
export class CloudFrontService {
  // Generate signed URL for private content
  static getSignedUrl(url: string, expiresIn: number = 3600): string {
    try {
      const privateKey = require('fs').readFileSync(config.aws.cloudfront.privateKeyPath, 'utf8');
      const keyPairId = config.aws.cloudfront.keyPairId;

      const expiration = Math.floor(Date.now() / 1000) + expiresIn; // Unix timestamp

      const signer = new AWS.CloudFront.Signer(keyPairId, privateKey);
      const signedUrl = signer.getSignedUrl({
        url,
        expires: expiration,
      });

      logger.debug('Generated CloudFront signed URL', { url, expires: expiration });
      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate CloudFront signed URL:', { url, error });
      throw error;
    }
  }

  // Invalidate CloudFront cache
  static async invalidateCache(paths: string[]): Promise<string> {
    try {
      const distributionId = config.aws.cloudfront.domain.split('.')[0]; // Extract distribution ID
      if (!distributionId) {
        throw new Error('CloudFront distribution ID not found');
      }

      const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
        },
      };

      const result = await cloudfront.createInvalidation(params).promise();
      const invalidationId = result.Invalidation?.Id || '';

      logger.info('CloudFront cache invalidation created', { paths, invalidationId });
      return invalidationId;
    } catch (error) {
      logger.error('Failed to invalidate CloudFront cache:', { paths, error });
      throw error;
    }
  }
}

// SES Helper Functions
export class SESService {
  // Send templated email
  static async sendTemplatedEmail(
    to: string | string[],
    templateName: string,
    templateData: Record<string, any>
  ): Promise<string> {
    try {
      const recipients = Array.isArray(to) ? to : [to];

      const params: AWS.SES.SendTemplatedEmailRequest = {
        Source: `${config.aws.ses.fromName} <${config.aws.ses.fromEmail}>`,
        Destination: {
          ToAddresses: recipients,
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData),
      };

      const result = await ses.sendTemplatedEmail(params).promise();
      const messageId = result.MessageId || '';

      logger.info('Templated email sent', { to: recipients, templateName, messageId });
      return messageId;
    } catch (error) {
      logger.error('Failed to send templated email:', { to, templateName, error });
      throw error;
    }
  }

  // Send simple email
  static async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    isHtml: boolean = false
  ): Promise<string> {
    try {
      const recipients = Array.isArray(to) ? to : [to];

      const params: AWS.SES.SendEmailRequest = {
        Source: `${config.aws.ses.fromName} <${config.aws.ses.fromEmail}>`,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: isHtml
            ? {
                Html: {
                  Data: body,
                  Charset: 'UTF-8',
                },
              }
            : {
                Text: {
                  Data: body,
                  Charset: 'UTF-8',
                },
              },
        },
      };

      const result = await ses.sendEmail(params).promise();
      const messageId = result.MessageId || '';

      logger.info('Email sent', { to: recipients, subject, messageId });
      return messageId;
    } catch (error) {
      logger.error('Failed to send email:', { to, subject, error });
      throw error;
    }
  }

  // Verify email address
  static async verifyEmailAddress(email: string): Promise<void> {
    try {
      const params = {
        EmailAddress: email,
      };

      await ses.verifyEmailIdentity(params).promise();
      logger.info('Email verification initiated', { email });
    } catch (error) {
      logger.error('Failed to verify email address:', { email, error });
      throw error;
    }
  }
}

// MediaConvert Helper Functions
export class MediaConvertService {
  // Create video transcoding job
  static async createTranscodingJob(
    inputS3Uri: string,
    outputS3Uri: string,
    jobSettings: any
  ): Promise<string> {
    try {
      const mediaConvertClient = await initializeMediaConvert();

      const params = {
        Role: config.aws.mediaConvert.roleArn,
        Queue: config.aws.mediaConvert.queueArn,
        Settings: {
          ...jobSettings,
          Inputs: [
            {
              FileInput: inputS3Uri,
              ...jobSettings.Inputs?.[0],
            },
          ],
          OutputGroups: jobSettings.OutputGroups.map((group: any) => ({
            ...group,
            OutputGroupSettings: {
              ...group.OutputGroupSettings,
              HlsGroupSettings: {
                ...group.OutputGroupSettings.HlsGroupSettings,
                Destination: outputS3Uri,
              },
            },
          })),
        },
      };

      const result = await mediaConvertClient.createJob(params).promise();
      const jobId = result.Job?.Id || '';

      logger.info('MediaConvert job created', { inputS3Uri, outputS3Uri, jobId });
      return jobId;
    } catch (error) {
      logger.error('Failed to create MediaConvert job:', { inputS3Uri, outputS3Uri, error });
      throw error;
    }
  }

  // Get job status
  static async getJobStatus(jobId: string): Promise<string> {
    try {
      const mediaConvertClient = await initializeMediaConvert();

      const params = { Id: jobId };
      const result = await mediaConvertClient.getJob(params).promise();

      const status = result.Job?.Status || 'UNKNOWN';
      logger.debug('MediaConvert job status retrieved', { jobId, status });
      return status;
    } catch (error) {
      logger.error('Failed to get MediaConvert job status:', { jobId, error });
      throw error;
    }
  }
}

// AWS Health Check
export const awsHealthCheck = async (): Promise<{
  s3: boolean;
  ses: boolean;
  mediaConvert: boolean;
}> => {
  const results = {
    s3: false,
    ses: false,
    mediaConvert: false,
  };

  try {
    // Test S3 connectivity
    await s3.listBuckets().promise();
    results.s3 = true;
    logger.debug('S3 health check passed');
  } catch (error) {
    logger.error('S3 health check failed:', error);
  }

  try {
    // Test SES connectivity
    await ses.getSendQuota().promise();
    results.ses = true;
    logger.debug('SES health check passed');
  } catch (error) {
    logger.error('SES health check failed:', error);
  }

  try {
    // Test MediaConvert connectivity
    if (config.aws.mediaConvert.endpoint) {
      const mediaConvertClient = await initializeMediaConvert();
      await mediaConvertClient.listQueues().promise();
      results.mediaConvert = true;
      logger.debug('MediaConvert health check passed');
    }
  } catch (error) {
    logger.error('MediaConvert health check failed:', error);
  }

  return results;
};
