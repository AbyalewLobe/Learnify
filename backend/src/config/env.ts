import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface Config {
  // Server
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  logLevel: string;

  // Database
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    pool: {
      min: number;
      max: number;
    };
  };

  // Redis
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string | undefined;
    db: number;
  };

  // JWT
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };

  // Stripe
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    connectClientId: string;
  };

  // AWS
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3: {
      buckets: {
        videos: string;
        resources: string;
        public: string;
        uploads: string;
      };
    };
    cloudfront: {
      domain: string;
      keyPairId: string;
      privateKeyPath: string;
    };
    ses: {
      fromEmail: string;
      fromName: string;
      region: string;
    };
    mediaConvert: {
      endpoint: string;
      roleArn: string;
      queueArn: string;
    };
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // File Upload Limits
  fileUpload: {
    maxVideoSizeMB: number;
    maxResourceSizeMB: number;
    maxImageSizeMB: number;
  };

  // Security
  security: {
    bcryptSaltRounds: number;
    passwordMinLength: number;
  };

  // Analytics
  analytics: {
    batchSize: number;
    batchIntervalMs: number;
  };
}

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    url: process.env.DATABASE_URL!,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'learnify_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
  },

  redis: {
    url: process.env.REDIS_URL!,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID || '',
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    s3: {
      buckets: {
        videos: process.env.S3_BUCKET_VIDEOS || 'learnify-videos-dev',
        resources: process.env.S3_BUCKET_RESOURCES || 'learnify-resources-dev',
        public: process.env.S3_BUCKET_PUBLIC || 'learnify-public-dev',
        uploads: process.env.S3_BUCKET_UPLOADS || 'learnify-uploads-dev',
      },
    },
    cloudfront: {
      domain: process.env.CLOUDFRONT_DOMAIN || '',
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || '',
      privateKeyPath: process.env.CLOUDFRONT_PRIVATE_KEY_PATH || '',
    },
    ses: {
      fromEmail: process.env.SES_FROM_EMAIL || 'noreply@learnify.com',
      fromName: process.env.SES_FROM_NAME || 'Learnify Platform',
      region: process.env.SES_REGION || 'us-east-1',
    },
    mediaConvert: {
      endpoint: process.env.MEDIACONVERT_ENDPOINT || '',
      roleArn: process.env.MEDIACONVERT_ROLE_ARN || '',
      queueArn: process.env.MEDIACONVERT_QUEUE_ARN || '',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  fileUpload: {
    maxVideoSizeMB: parseInt(process.env.MAX_VIDEO_SIZE_MB || '2048', 10),
    maxResourceSizeMB: parseInt(process.env.MAX_RESOURCE_SIZE_MB || '100', 10),
    maxImageSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  },

  analytics: {
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000', 10),
    batchIntervalMs: parseInt(process.env.ANALYTICS_BATCH_INTERVAL_MS || '300000', 10),
  },
};
