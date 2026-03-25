/**
 * @deprecated This file is deprecated. Use Prisma Client from '../config/prisma' instead.
 *
 * The Database class has been replaced by Prisma Client for type-safe database operations.
 * This file is kept temporarily for backward compatibility but will be removed in a future version.
 *
 * Migration guide:
 * - Replace `import { database } from './config/database'` with `import { prisma } from './config/prisma'`
 * - Replace `database.query()` with Prisma Client methods
 * - Replace `database.healthCheck()` with `prisma.$queryRaw\`SELECT 1\``
 * - Replace `database.close()` with `PrismaClientSingleton.disconnect()`
 */

import { prisma, PrismaClientSingleton } from './prisma';
import { logger } from '../utils/logger';

/**
 * @deprecated Use Prisma Client from '../config/prisma' instead
 */
class Database {
  private static instance: Database;

  private constructor() {
    logger.warn(
      'Database class is deprecated. Please use Prisma Client from ../config/prisma instead.'
    );
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * @deprecated Use prisma.$queryRaw or prisma.$executeRaw instead
   */
  public async query(_text: string, _params?: any[]): Promise<any> {
    throw new Error('Database.query() is no longer supported. Use Prisma Client methods instead.');
  }

  /**
   * @deprecated Use prisma.$queryRaw\`SELECT 1\` instead
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * @deprecated Use PrismaClientSingleton.disconnect() instead
   */
  public async close(): Promise<void> {
    await PrismaClientSingleton.disconnect();
  }
}

/**
 * @deprecated Use prisma from '../config/prisma' instead
 */
export const database = Database.getInstance();
export { Database };
