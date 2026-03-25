import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Maximum requests per window
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limiting middleware using Redis
 * Limits requests per user per time window
 *
 * Default: 100 requests per minute per user
 *
 * @param options - Rate limit configuration options
 * @returns Express middleware function
 *
 * @example
 * // Use default settings (100 req/min)
 * router.use(rateLimit());
 *
 * // Custom settings
 * router.use(rateLimit({ maxRequests: 50, windowMs: 60000 }));
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyPrefix = 'ratelimit:',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const windowSeconds = Math.floor(windowMs / 1000);

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user identifier (use IP if not authenticated)
      const identifier = req.user?.userId || req.ip || 'anonymous';
      const key = `${keyPrefix}${identifier}`;

      // Get current request count
      let requestCount: number;
      let ttl: number;

      try {
        const currentCount = await redisClient.get(key);
        requestCount = currentCount ? parseInt(currentCount, 10) : 0;

        // Get TTL for the key
        ttl = await redisClient.ttl(key);
        if (ttl === -1) {
          // Key exists but has no expiration, set it
          await redisClient.expire(key, windowSeconds);
          ttl = windowSeconds;
        } else if (ttl === -2) {
          // Key doesn't exist
          ttl = windowSeconds;
        }
      } catch (error) {
        logger.error('Redis error in rate limiter:', error);
        // If Redis fails, allow the request (fail open)
        next();
        return;
      }

      // Check if limit exceeded
      if (requestCount >= maxRequests) {
        const retryAfter = ttl > 0 ? ttl : windowSeconds;

        logger.warn(
          `Rate limit exceeded for ${identifier}: ${requestCount}/${maxRequests} requests`
        );

        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter,
        });
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
        return;
      }

      // Increment request count
      try {
        // Use get and set to increment (since incr is not available)
        const currentCount = await redisClient.get(key);
        const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;

        // Set the new count with expiration
        await redisClient.set(key, newCount.toString(), { EX: windowSeconds });

        // Add rate limit headers
        const remaining = Math.max(0, maxRequests - newCount);
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());

        logger.debug(`Rate limit check for ${identifier}: ${newCount}/${maxRequests} requests`);
      } catch (error) {
        logger.error('Redis error incrementing rate limit counter:', error);
        // If Redis fails, allow the request (fail open)
      }

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (body: any): Response {
          const statusCode = res.statusCode;
          const shouldSkip =
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400);

          if (shouldSkip) {
            // Decrement counter by getting current value and setting it minus 1
            // Fire-and-forget pattern - don't wait for this to complete
            (async () => {
              try {
                const currentCount = await redisClient.get(key);
                if (currentCount) {
                  const newCount = Math.max(0, parseInt(currentCount, 10) - 1);
                  await redisClient.set(key, newCount.toString(), {
                    EX: windowSeconds,
                  });
                }
              } catch (error) {
                logger.error('Redis error decrementing rate limit counter:', error);
              }
            })();
          }

          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // If there's an error, allow the request (fail open)
      next();
    }
  };
};

/**
 * Create a rate limiter for specific routes with custom limits
 *
 * @example
 * // Strict limit for auth endpoints
 * router.post('/login', createRateLimiter(5, 60000), loginHandler);
 *
 * // Lenient limit for read operations
 * router.get('/courses', createRateLimiter(200, 60000), getCoursesHandler);
 */
export const createRateLimiter = (maxRequests: number, windowMs: number, keyPrefix?: string) => {
  return rateLimit({ maxRequests, windowMs, keyPrefix });
};
