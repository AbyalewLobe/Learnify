import { Pool } from 'pg';
import { database } from '../config/database';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'creator' | 'admin';
  is_active: boolean;
  profile_image_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'creator' | 'admin';
}

export interface UpdateUserDTO {
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  bio?: string;
}

export class UserRepository {
  private pool: Pool;

  constructor() {
    this.pool = database.getPool();
  }

  /**
   * Create a new user
   * @param userData - User data to create
   * @returns Created user
   */
  async create(userData: CreateUserDTO): Promise<User> {
    try {
      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.role,
      ];

      const result = await this.pool.query(query, values);
      logger.info('User created', { userId: result.rows[0].id, email: userData.email });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User or null if not found
   */
  async findById(id: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.pool.query(query, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param id - User ID
   * @param updates - Fields to update
   * @returns Updated user
   */
  async update(id: string, updates: UpdateUserDTO): Promise<User> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.first_name !== undefined) {
        fields.push(`first_name = $${paramCount++}`);
        values.push(updates.first_name);
      }

      if (updates.last_name !== undefined) {
        fields.push(`last_name = $${paramCount++}`);
        values.push(updates.last_name);
      }

      if (updates.profile_image_url !== undefined) {
        fields.push(`profile_image_url = $${paramCount++}`);
        values.push(updates.profile_image_url);
      }

      if (updates.bio !== undefined) {
        fields.push(`bio = $${paramCount++}`);
        values.push(updates.bio);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      logger.info('User updated', { userId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param id - User ID
   * @param passwordHash - New password hash
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await this.pool.query(query, [passwordHash, id]);
      logger.info('User password updated', { userId: id });
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   * @param id - User ID
   */
  async deactivate(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await this.pool.query(query, [id]);
      logger.info('User deactivated', { userId: id });
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Activate user
   * @param id - User ID
   */
  async activate(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await this.pool.query(query, [id]);
      logger.info('User activated', { userId: id });
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param email - Email to check
   * @returns True if email exists, false otherwise
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)';
      const result = await this.pool.query(query, [email]);
      return result.rows[0].exists;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
