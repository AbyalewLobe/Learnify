import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date | null;
}

// Type for transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class RefreshTokenRepository {
  private prisma: PrismaClient | TransactionClient;

  constructor(prismaClient?: PrismaClient | TransactionClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Create a new refresh token
   * @param userId - User ID
   * @param tokenHash - Hashed token
   * @param expiresAt - Expiration date
   * @returns Created refresh token
   */
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    try {
      const refreshToken = await this.prisma.refreshToken.create({
        data: {
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt,
        },
      });

      logger.debug('Refresh token created', { userId, tokenId: refreshToken.id });
      return refreshToken as RefreshToken;
    } catch (error) {
      logger.error('Error creating refresh token:', error);
      throw error;
    }
  }

  /**
   * Find refresh token by hash
   * @param tokenHash - Hashed token
   * @returns Refresh token or null if not found
   */
  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.prisma.refreshToken.findFirst({
        where: {
          token_hash: tokenHash,
          revoked_at: null,
        },
      });

      return refreshToken as RefreshToken | null;
    } catch (error) {
      logger.error('Error finding refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke a refresh token
   * @param tokenHash - Hashed token to revoke
   */
  async revoke(tokenHash: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: {
          token_hash: tokenHash,
        },
        data: {
          revoked_at: new Date(),
        },
      });

      logger.debug('Refresh token revoked', { tokenHash });
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID
   */
  async revokeAllForUser(userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
          revoked_at: null,
        },
        data: {
          revoked_at: new Date(),
        },
      });

      logger.info('All refresh tokens revoked for user', { userId });
    } catch (error) {
      logger.error('Error revoking all refresh tokens for user:', error);
      throw error;
    }
  }

  /**
   * Delete expired tokens (cleanup)
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      const deletedCount = result.count;
      logger.info('Expired refresh tokens deleted', { count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting expired refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Check if token is valid (not expired and not revoked)
   * @param tokenHash - Hashed token
   * @returns True if valid, false otherwise
   */
  async isValid(tokenHash: string): Promise<boolean> {
    try {
      const count = await this.prisma.refreshToken.count({
        where: {
          token_hash: tokenHash,
          revoked_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      return count > 0;
    } catch (error) {
      logger.error('Error checking token validity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const refreshTokenRepository = new RefreshTokenRepository();
