import { Pool, PoolConfig } from 'pg';
import { config } from './env';
import { logger } from '../utils/logger';

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    const poolConfig: PoolConfig = {
      connectionString: config.database.url,
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      min: config.database.pool.min,
      max: config.database.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', err => {
      logger.error('Unexpected error on idle client', err);
    });

    // Handle pool connection
    this.pool.on('connect', _client => {
      logger.debug('New client connected to database');
    });

    // Handle pool removal
    this.pool.on('remove', _client => {
      logger.debug('Client removed from pool');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { text, params, error });
      throw error;
    }
  }

  public async getClient() {
    return await this.pool.connect();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      logger.info('Database health check passed', {
        currentTime: result.rows[0]?.current_time,
      });
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool', error);
      throw error;
    }
  }
}

export const database = Database.getInstance();
export { Database };
