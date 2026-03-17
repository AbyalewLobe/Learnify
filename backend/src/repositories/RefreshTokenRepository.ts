import { Pool } from 'pg';
import { database } from '../config/database';
import { logger } from '../utils/logger';

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
}

export class RefreshTokenRepository {
  private pool: Pool;

  constructor() {
    this.pool = database.getPool();
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
      const query = `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await this.pool.query(query, [userId, tokenHash, expiresAt]);
      logger.debug('Refresh token created', { userId, tokenId: result.rows[0].id });
      return result.rows[0];
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
      const query = `
        SELECT * FROM refresh_tokens
        WHERE token_hash = $1 AND revoked_at IS NULL
      `;

      const result = await this.pool.query(query, [tokenHash]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
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
      const query = `
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE token_hash = $1
      `;

      await this.pool.query(query, [tokenHash]);
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
      const query = `
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND revoked_at IS NULL
      `;

      await this.pool.query(query, [userId]);
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
      const query = `
        DELETE FROM refresh_tokens
        WHERE expires_at < CURRENT_TIMESTAMP
      `;

      const result = await this.pool.query(query);
      const deletedCount = result.rowCount || 0;
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
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM refresh_tokens
          WHERE token_hash = $1
            AND revoked_at IS NULL
            AND expires_at > CURRENT_TIMESTAMP
        )
      `;

      const result = await this.pool.query(query, [tokenHash]);
      return result.rows[0].exists;
    } catch (error) {
      logger.error('Error checking token validity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const refreshTokenRepository = new RefreshTokenRepository();
