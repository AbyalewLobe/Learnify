import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class PrismaClientSingleton {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        (PrismaClientSingleton.instance.$on as any)('query', (e: any) => {
          logger.debug('Prisma Query', {
            query: e.query,
            params: e.params,
            duration: e.duration,
          });
        });
      }

      // Log errors
      (PrismaClientSingleton.instance.$on as any)('error', (e: any) => {
        logger.error('Prisma Error', e);
      });
    }

    return PrismaClientSingleton.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      logger.info('Prisma Client disconnected');
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();
export { PrismaClientSingleton };
