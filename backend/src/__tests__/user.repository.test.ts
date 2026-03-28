import { PrismaClient } from '@prisma/client';
import { UserRepository, CreateUserDTO, UpdateUserDTO } from '../repositories/UserRepository';

/**
 * Unit Tests for UserRepository
 * Tests specific examples and edge cases for UserRepository methods
 *
 * **Validates: Requirements 3.11, 12.1, 12.2, 12.3, 12.4, 12.5**
 */

describe('Unit Tests: UserRepository', () => {
  let prisma: PrismaClient;
  let userRepository: UserRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    userRepository = new UserRepository(prisma);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create()', () => {
    it('should create a new user with valid data', async () => {
      const userData: CreateUserDTO = {
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password_hash).toBe(userData.password_hash);
      expect(user.first_name).toBe(userData.first_name);
      expect(user.last_name).toBe(userData.last_name);
      expect(user.role).toBe(userData.role);
      expect(user.is_active).toBe(true);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });

    it('should throw error when creating user with duplicate email', async () => {
      const userData: CreateUserDTO = {
        email: 'duplicate@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student',
      };

      // Create first user
      await userRepository.create(userData);

      // Attempt to create second user with same email
      await expect(userRepository.create(userData)).rejects.toThrow();
    });

    it('should create users with different roles', async () => {
      const studentData: CreateUserDTO = {
        email: 'student@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Student',
        last_name: 'User',
        role: 'student',
      };

      const creatorData: CreateUserDTO = {
        email: 'creator@example.com',
        password_hash: 'hashed_password_456',
        first_name: 'Creator',
        last_name: 'User',
        role: 'creator',
      };

      const adminData: CreateUserDTO = {
        email: 'admin@example.com',
        password_hash: 'hashed_password_789',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      };

      const student = await userRepository.create(studentData);
      const creator = await userRepository.create(creatorData);
      const admin = await userRepository.create(adminData);

      expect(student.role).toBe('student');
      expect(creator.role).toBe('creator');
      expect(admin.role).toBe('admin');
    });
  });

  describe('findById()', () => {
    it('should find an existing user by ID', async () => {
      const userData: CreateUserDTO = {
        email: 'findbyid@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Find',
        last_name: 'ById',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      const found = await userRepository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(userData.email);
      expect(found?.first_name).toBe(userData.first_name);
      expect(found?.last_name).toBe(userData.last_name);
    });

    it('should return null for non-existent user ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const found = await userRepository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    it('should find an existing user by email', async () => {
      const userData: CreateUserDTO = {
        email: 'findbyemail@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Find',
        last_name: 'ByEmail',
        role: 'creator',
      };

      const created = await userRepository.create(userData);
      const found = await userRepository.findByEmail(userData.email);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(userData.email);
      expect(found?.role).toBe(userData.role);
    });

    it('should return null for non-existent email', async () => {
      const found = await userRepository.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });

    it('should be case-sensitive for email lookup', async () => {
      const userData: CreateUserDTO = {
        email: 'CaseSensitive@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Case',
        last_name: 'Sensitive',
        role: 'student',
      };

      await userRepository.create(userData);

      // Exact match should work
      const exactMatch = await userRepository.findByEmail('CaseSensitive@example.com');
      expect(exactMatch).not.toBeNull();

      // Different case should not match (PostgreSQL default behavior)
      const differentCase = await userRepository.findByEmail('casesensitive@example.com');
      expect(differentCase).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update user fields', async () => {
      const userData: CreateUserDTO = {
        email: 'update@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Original',
        last_name: 'Name',
        role: 'student',
      };

      const created = await userRepository.create(userData);

      const updates: UpdateUserDTO = {
        first_name: 'Updated',
        last_name: 'User',
        bio: 'This is my bio',
      };

      const updated = await userRepository.update(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.first_name).toBe(updates.first_name);
      expect(updated.last_name).toBe(updates.last_name);
      expect(updated.bio).toBe(updates.bio);
      expect(updated.email).toBe(userData.email); // Unchanged
      expect(updated.role).toBe(userData.role); // Unchanged
    });

    it('should update profile image URL', async () => {
      const userData: CreateUserDTO = {
        email: 'profileimage@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Profile',
        last_name: 'Image',
        role: 'creator',
      };

      const created = await userRepository.create(userData);

      const updates: UpdateUserDTO = {
        profile_image_url: 'https://example.com/profile.jpg',
      };

      const updated = await userRepository.update(created.id, updates);

      expect(updated.profile_image_url).toBe(updates.profile_image_url);
      expect(updated.first_name).toBe(userData.first_name); // Unchanged
      expect(updated.last_name).toBe(userData.last_name); // Unchanged
    });

    it('should throw error when updating non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updates: UpdateUserDTO = {
        first_name: 'Updated',
      };

      await expect(userRepository.update(nonExistentId, updates)).rejects.toThrow();
    });
  });

  describe('updatePassword()', () => {
    it('should update user password', async () => {
      const userData: CreateUserDTO = {
        email: 'password@example.com',
        password_hash: 'old_hashed_password',
        first_name: 'Password',
        last_name: 'Test',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      const newPasswordHash = 'new_hashed_password';

      await userRepository.updatePassword(created.id, newPasswordHash);

      const updated = await userRepository.findById(created.id);

      expect(updated).not.toBeNull();
      expect(updated?.password_hash).toBe(newPasswordHash);
      expect(updated?.password_hash).not.toBe(userData.password_hash);
    });

    it('should not affect other user fields when updating password', async () => {
      const userData: CreateUserDTO = {
        email: 'passwordonly@example.com',
        password_hash: 'old_hashed_password',
        first_name: 'Password',
        last_name: 'Only',
        role: 'creator',
      };

      const created = await userRepository.create(userData);
      const newPasswordHash = 'new_hashed_password';

      await userRepository.updatePassword(created.id, newPasswordHash);

      const updated = await userRepository.findById(created.id);

      expect(updated?.email).toBe(userData.email);
      expect(updated?.first_name).toBe(userData.first_name);
      expect(updated?.last_name).toBe(userData.last_name);
      expect(updated?.role).toBe(userData.role);
      expect(updated?.is_active).toBe(true);
    });

    it('should throw error when updating password for non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const newPasswordHash = 'new_hashed_password';

      await expect(userRepository.updatePassword(nonExistentId, newPasswordHash)).rejects.toThrow();
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active user', async () => {
      const userData: CreateUserDTO = {
        email: 'deactivate@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Deactivate',
        last_name: 'Test',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      expect(created.is_active).toBe(true);

      await userRepository.deactivate(created.id);

      const deactivated = await userRepository.findById(created.id);
      expect(deactivated).not.toBeNull();
      expect(deactivated?.is_active).toBe(false);
    });

    it('should remain deactivated when deactivating already inactive user', async () => {
      const userData: CreateUserDTO = {
        email: 'alreadyinactive@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Already',
        last_name: 'Inactive',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      await userRepository.deactivate(created.id);

      // Deactivate again
      await userRepository.deactivate(created.id);

      const user = await userRepository.findById(created.id);
      expect(user?.is_active).toBe(false);
    });

    it('should throw error when deactivating non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(userRepository.deactivate(nonExistentId)).rejects.toThrow();
    });
  });

  describe('activate()', () => {
    it('should activate an inactive user', async () => {
      const userData: CreateUserDTO = {
        email: 'activate@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Activate',
        last_name: 'Test',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      await userRepository.deactivate(created.id);

      const deactivated = await userRepository.findById(created.id);
      expect(deactivated?.is_active).toBe(false);

      await userRepository.activate(created.id);

      const activated = await userRepository.findById(created.id);
      expect(activated).not.toBeNull();
      expect(activated?.is_active).toBe(true);
    });

    it('should remain active when activating already active user', async () => {
      const userData: CreateUserDTO = {
        email: 'alreadyactive@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Already',
        last_name: 'Active',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      expect(created.is_active).toBe(true);

      // Activate again
      await userRepository.activate(created.id);

      const user = await userRepository.findById(created.id);
      expect(user?.is_active).toBe(true);
    });

    it('should throw error when activating non-existent user', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(userRepository.activate(nonExistentId)).rejects.toThrow();
    });
  });

  describe('emailExists()', () => {
    it('should return true for existing email', async () => {
      const userData: CreateUserDTO = {
        email: 'exists@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Exists',
        last_name: 'Test',
        role: 'student',
      };

      await userRepository.create(userData);

      const exists = await userRepository.emailExists(userData.email);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await userRepository.emailExists('doesnotexist@example.com');
      expect(exists).toBe(false);
    });

    it('should return true even for deactivated user email', async () => {
      const userData: CreateUserDTO = {
        email: 'deactivateduser@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Deactivated',
        last_name: 'User',
        role: 'student',
      };

      const created = await userRepository.create(userData);
      await userRepository.deactivate(created.id);

      const exists = await userRepository.emailExists(userData.email);
      expect(exists).toBe(true);
    });

    it('should be consistent with findByEmail', async () => {
      const userData: CreateUserDTO = {
        email: 'consistency@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Consistency',
        last_name: 'Test',
        role: 'creator',
      };

      await userRepository.create(userData);

      const exists = await userRepository.emailExists(userData.email);
      const found = await userRepository.findByEmail(userData.email);

      expect(exists).toBe(true);
      expect(found).not.toBeNull();
    });
  });

  describe('Transaction support', () => {
    it('should accept optional PrismaClient for transaction support', async () => {
      const userData: CreateUserDTO = {
        email: 'transaction@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Transaction',
        last_name: 'Test',
        role: 'student',
      };

      await prisma.$transaction(async tx => {
        const txUserRepository = new UserRepository(tx);
        const user = await txUserRepository.create(userData);

        expect(user).toBeDefined();
        expect(user.email).toBe(userData.email);
      });

      // Verify user was created
      const found = await userRepository.findByEmail(userData.email);
      expect(found).not.toBeNull();
    });

    it('should rollback transaction on error', async () => {
      const userData: CreateUserDTO = {
        email: 'rollback@example.com',
        password_hash: 'hashed_password_123',
        first_name: 'Rollback',
        last_name: 'Test',
        role: 'student',
      };

      try {
        await prisma.$transaction(async tx => {
          const txUserRepository = new UserRepository(tx);
          await txUserRepository.create(userData);

          // Force an error to trigger rollback
          throw new Error('Intentional error for rollback test');
        });
      } catch (error) {
        // Expected error
      }

      // Verify user was NOT created due to rollback
      const found = await userRepository.findByEmail(userData.email);
      expect(found).toBeNull();
    });
  });
});
