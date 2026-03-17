import { createClient, RedisClientType } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger';

class RedisClient {
  private client: RedisClientType;
  private static instance: RedisClient;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      url: config.redis.url,
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: retries => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          const delay = Math.min(retries * 50, 2000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
      ...(config.redis.password && { password: config.redis.password }),
      database: config.redis.db,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      logger.info('Redis client connected and ready');
      this.isConnected = true;
    });

    this.client.on('error', error => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
      this.isConnected = false;
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('Redis client disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected;
  }

  // Cache operations with namespacing
  public async set(
    key: string,
    value: string,
    options?: { EX?: number; PX?: number; NX?: boolean; XX?: boolean }
  ): Promise<string | null> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.set(namespacedKey, value, options as any);
    } catch (error) {
      logger.error('Redis SET error:', { key, error });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.get(namespacedKey);
    } catch (error) {
      logger.error('Redis GET error:', { key, error });
      throw error;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.del(namespacedKey);
    } catch (error) {
      logger.error('Redis DEL error:', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.exists(namespacedKey);
    } catch (error) {
      logger.error('Redis EXISTS error:', { key, error });
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.expire(namespacedKey, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error:', { key, seconds, error });
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.ttl(namespacedKey);
    } catch (error) {
      logger.error('Redis TTL error:', { key, error });
      throw error;
    }
  }

  // Hash operations
  public async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.hSet(namespacedKey, field, value);
    } catch (error) {
      logger.error('Redis HSET error:', { key, field, error });
      throw error;
    }
  }

  public async hGet(key: string, field: string): Promise<string | undefined> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.hGet(namespacedKey, field);
    } catch (error) {
      logger.error('Redis HGET error:', { key, field, error });
      throw error;
    }
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.hGetAll(namespacedKey);
    } catch (error) {
      logger.error('Redis HGETALL error:', { key, error });
      throw error;
    }
  }

  public async hDel(key: string, field: string): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.hDel(namespacedKey, field);
    } catch (error) {
      logger.error('Redis HDEL error:', { key, field, error });
      throw error;
    }
  }

  // List operations
  public async lPush(key: string, ...elements: string[]): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.lPush(namespacedKey, elements);
    } catch (error) {
      logger.error('Redis LPUSH error:', { key, elements, error });
      throw error;
    }
  }

  public async rPop(key: string): Promise<string | null> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.rPop(namespacedKey);
    } catch (error) {
      logger.error('Redis RPOP error:', { key, error });
      throw error;
    }
  }

  // Set operations
  public async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.sAdd(namespacedKey, members);
    } catch (error) {
      logger.error('Redis SADD error:', { key, members, error });
      throw error;
    }
  }

  public async sMembers(key: string): Promise<string[]> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.sMembers(namespacedKey);
    } catch (error) {
      logger.error('Redis SMEMBERS error:', { key, error });
      throw error;
    }
  }

  public async sRem(key: string, ...members: string[]): Promise<number> {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return await this.client.sRem(namespacedKey, members);
    } catch (error) {
      logger.error('Redis SREM error:', { key, members, error });
      throw error;
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      logger.debug('Redis health check passed:', result);
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cache key namespacing
  private getNamespacedKey(key: string): string {
    const namespace = config.nodeEnv === 'production' ? 'learnify:prod' : 'learnify:dev';
    return `${namespace}:${key}`;
  }

  // JSON operations (for complex objects)
  public async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const options = ttl ? { EX: ttl } : undefined;
      await this.set(key, serialized, options);
    } catch (error) {
      logger.error('Redis setJSON error:', { key, error });
      throw error;
    }
  }

  public async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis getJSON error:', { key, error });
      throw error;
    }
  }
}

export const redisClient = RedisClient.getInstance();
export { RedisClient };
