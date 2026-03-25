import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { ConflictError, NotFoundError, BadRequestError, InternalServerError } from './errors';

/**
 * Prisma error handler utility
 * Maps Prisma error codes to application-specific errors
 */
export class PrismaErrorHandler {
  /**
   * Handle Prisma errors and map them to application-specific errors
   * @param error - The error to handle
   * @throws Application-specific error based on Prisma error code
   */
  static handle(error: unknown): never {
    // Handle known Prisma request errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handleKnownError(error);
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      logger.error('Prisma validation error', { error: error.message });
      throw new BadRequestError('Invalid query parameters');
    }

    // Handle Prisma initialization errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      logger.error('Prisma initialization error', { error: error.message });
      throw new InternalServerError('Database connection failed');
    }

    // Handle unknown Prisma request errors
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      logger.error('Unknown Prisma request error', { error: error.message });
      throw new InternalServerError('Database operation failed');
    }

    // Handle Prisma Rust panic errors
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      logger.error('Prisma Rust panic error', { error: error.message });
      throw new InternalServerError('Database engine error');
    }

    // Unknown error type
    logger.error('Unknown error in Prisma operation', { error });
    throw new InternalServerError('Database operation failed');
  }

  /**
   * Handle known Prisma request errors
   * @param error - The Prisma known request error
   * @throws Application-specific error based on error code
   */
  private static handleKnownError(error: Prisma.PrismaClientKnownRequestError): never {
    const { code, meta } = error;

    switch (code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (meta?.target as string[]) || [];
        const fields = target.length > 0 ? target.join(', ') : 'field';
        logger.warn('Unique constraint violation', { code, target, meta });
        throw new ConflictError(`Resource with ${fields} already exists`);
      }

      case 'P2003': {
        // Foreign key constraint violation
        const field = (meta?.field_name as string) || 'reference';
        logger.warn('Foreign key constraint violation', { code, field, meta });
        throw new BadRequestError(`Invalid reference: ${field} does not exist`);
      }

      case 'P2025': {
        // Record not found (for update/delete operations)
        logger.debug('Record not found', { code, meta });
        throw new NotFoundError('Resource not found');
      }

      case 'P2014': {
        // Relation violation
        const relation = (meta?.relation_name as string) || 'relation';
        logger.warn('Relation violation', { code, relation, meta });
        throw new BadRequestError(`Cannot perform operation due to related ${relation}`);
      }

      case 'P2034': {
        // Transaction conflict
        logger.warn('Transaction conflict', { code, meta });
        throw new ConflictError('Transaction conflict, please retry');
      }

      default: {
        // Unhandled Prisma error code
        logger.error('Unhandled Prisma error code', { code, meta, message: error.message });
        throw new InternalServerError('Database operation failed');
      }
    }
  }
}
