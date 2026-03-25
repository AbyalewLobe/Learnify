import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
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

// Type for transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class UserRepository {
  private prisma: PrismaClient | TransactionClient;

  constructor(prismaClient?: PrismaClient | TransactionClient) {
    // Accept optional Prisma client for transaction support
    this.prisma = prismaClient || prisma;
  }

  /**
   * Create a new user
   * @param userData - User data to create
   * @returns Created user
   */
  async create(userData: CreateUserDTO): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          password_hash: userData.password_hash,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        },
      });
      logger.info('User created', { userId: user.id, email: userData.email });
      return user as User;
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
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      return user as User | null;
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
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      return user as User | null;
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
  /**
   * Update user
   * @param id - User ID
   * @param updates - Fields to update
   * @returns Updated user
   */
  async update(id: string, updates: UpdateUserDTO): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updates,
      });
      logger.info('User updated', { userId: id });
      return user as User;
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
      await this.prisma.user.update({
        where: { id },
        data: { password_hash: passwordHash },
      });
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
      await this.prisma.user.update({
        where: { id },
        data: { is_active: false },
      });
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
      await this.prisma.user.update({
        where: { id },
        data: { is_active: true },
      });
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
      const count = await this.prisma.user.count({
        where: { email },
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
