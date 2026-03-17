import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { database } from './config/database';
import { redisClient } from './config/redis';
import { awsHealthCheck } from './config/aws';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis connection
const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connection initialized');
  } catch (error) {
    logger.error('Failed to initialize Redis connection:', error);
    // Continue without Redis for development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with database, Redis, and AWS connectivity
app.get('/health', async (req, res) => {
  try {
    const [dbHealthy, redisHealthy, awsHealth] = await Promise.all([
      database.healthCheck(),
      redisClient.isReady() ? redisClient.healthCheck() : Promise.resolve(false),
      awsHealthCheck(),
    ]);

    const allServicesHealthy = dbHealthy && redisHealthy && awsHealth.s3 && awsHealth.ses;
    const status = allServicesHealthy ? 'OK' : 'DEGRADED';
    const statusCode = status === 'OK' ? 200 : 503;

    res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
        aws: {
          s3: awsHealth.s3 ? 'connected' : 'disconnected',
          ses: awsHealth.ses ? 'connected' : 'disconnected',
          mediaConvert: awsHealth.mediaConvert ? 'connected' : 'disconnected',
        },
      },
      version: '1.0.0',
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      services: {
        database: 'error',
        redis: 'error',
        aws: 'error',
      },
      error: 'Service health check failed',
    });
  }
});

// API routes will be added here
app.use('/api/v1', (req, res) => {
  res.status(200).json({
    message: 'Learnify Backend API v1',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');

  try {
    await Promise.all([database.close(), redisClient.disconnect()]);
    logger.info('All connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize Redis
    await initializeRedis();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
