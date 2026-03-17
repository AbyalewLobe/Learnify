import bcrypt from 'bcrypt';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class PasswordService {
  private readonly saltRounds: number;
  private readonly minLength: number;

  constructor() {
    this.saltRounds = config.security.bcryptSaltRounds;
    this.minLength = config.security.passwordMinLength;
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password to hash
   * @returns Hashed password
   */
  async hash(password: string): Promise<string> {
    try {
      // Validate password before hashing
      this.validatePassword(password);

      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns True if passwords match, false otherwise
   */
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      logger.debug('Password comparison completed', { isMatch });
      return isMatch;
    } catch (error) {
      logger.error('Error comparing passwords:', error);
      throw error;
    }
  }

  /**
   * Validate password meets complexity requirements
   * @param password - Password to validate
   * @throws Error if password doesn't meet requirements
   */
  validatePassword(password: string): void {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < this.minLength) {
      throw new Error(`Password must be at least ${this.minLength} characters long`);
    }

    // Additional validation rules can be added here
    // For example: uppercase, lowercase, numbers, special characters
  }
}

// Export singleton instance
export const passwordService = new PasswordService();
