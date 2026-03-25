import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository';

/**
 * Property-Based Tests for UserRepository
 * Validates correctness properties for user repository operations
 */

describe('Property-Based Tests: UserRepository', () => {
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

  /**
   * Task 6.7: Property Test for Repository Create-Find Round Trip
   * Property 5: Repository Create-Find Round Trip
   * **Validates: Requirements 3.2, 3.3**
   *
   * For all repositories (User, Course, RefreshToken) and any valid entity data,
   * creating an entity and then finding it by ID SHALL return an entity with equivalent data.
   */
  describe('Property 5: Repository Create-Find Round Trip', () => {
    it('should round-trip user creation and retrieval by ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          async (userData) => {
            // Create user
            const created = await userRepository.create(userData);

            // Find by ID
            const found = await userRepository.findById(created.id);

            // Verify round trip
            expect(found).not.toBeNull();
            expect(found?.id).toBe(created.id);
            expect(found?.email).toBe(userData.email);
            expect(found?.password_hash).toBe(userData.password_hash);
            expect(found?.first_name).toBe(userData.first_name);
            expect(found?.last_name).toBe(userData.last_name);
            expect(found?.role).toBe(userData.role);
            expect(found?.is_active).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round-trip user creation and retrieval by email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          async (userData) => {
            // Create user
            const created = await userRepository.create(userData);

            // Find by email
            const found = await userRepository.findByEmail(userData.email);

            // Verify round trip
            expect(found).not.toBeNull();
            expect(found?.id).toBe(created.id);
            expect(found?.email).toBe(userData.email);
            expect(found?.password_hash).toBe(userData.password_hash);
            expect(found?.first_name).toBe(userData.first_name);
            expect(found?.last_name).toBe(userData.last_name);
            expect(found?.role).toBe(userData.role);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 6.8: Property Test for Repository Update Idempotence
   * Property 6: Repository Update Idempotence
   * **Validates: Requirements 3.5**
   *
   * For all repositories and any entity, updating an entity with the same data twice
   * SHALL produce the same result as updating once.
   */
  describe('Property 6: Repository Update Idempotence', () => {
    it('should produce identical results when updating with same data twice', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.record({
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            bio: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          }),
          async (userData, updateData) => {
            try {
              // Create user
              const created = await userRepository.create(userData);

              // Update once
              const firstUpdate = await userRepository.update(created.id, updateData);

              // Update again with same data
              const secondUpdate = await userRepository.update(created.id, updateData);

              // Verify idempotence - both updates should produce identical results
              expect(secondUpdate.first_name).toBe(firstUpdate.first_name);
              expect(secondUpdate.last_name).toBe(firstUpdate.last_name);
              expect(secondUpdate.bio).toBe(firstUpdate.bio);
              expect(secondUpdate.profile_image_url).toBe(firstUpdate.profile_image_url);
              
              // Verify the data matches what was updated (Prisma normalizes undefined to null)
              expect(secondUpdate.first_name).toBe(updateData.first_name);
              expect(secondUpdate.last_name).toBe(updateData.last_name);
              expect(secondUpdate.bio).toBe(updateData.bio ?? null);
              
              // Verify other fields remain unchanged
              expect(secondUpdate.email).toBe(userData.email);
              expect(secondUpdate.role).toBe(userData.role);
              expect(secondUpdate.is_active).toBe(true);
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 6.9: Property Test for User Activation State Toggle
   * Property 7: User Activation State Toggle
   * **Validates: Requirements 3.7, 3.8**
   *
   * For all users, deactivating an active user SHALL set is_active to false,
   * and activating an inactive user SHALL set is_active to true.
   */
  describe('Property 7: User Activation State Toggle', () => {
    it('should toggle user activation state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          async (userData) => {
            try {
              // Create user (starts as active by default)
              const created = await userRepository.create(userData);
              expect(created.is_active).toBe(true);

              // Deactivate active user
              await userRepository.deactivate(created.id);
              const deactivated = await userRepository.findById(created.id);
              expect(deactivated).not.toBeNull();
              expect(deactivated?.is_active).toBe(false);

              // Activate inactive user
              await userRepository.activate(created.id);
              const activated = await userRepository.findById(created.id);
              expect(activated).not.toBeNull();
              expect(activated?.is_active).toBe(true);

              // Verify multiple toggles work correctly
              await userRepository.deactivate(created.id);
              const deactivatedAgain = await userRepository.findById(created.id);
              expect(deactivatedAgain?.is_active).toBe(false);

              await userRepository.activate(created.id);
              const activatedAgain = await userRepository.findById(created.id);
              expect(activatedAgain?.is_active).toBe(true);
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 6.10: Property Test for Email Existence Consistency
   * Property 8: Email Existence Consistency
   * **Validates: Requirements 3.9**
   *
   * For all email addresses, emailExists() SHALL return true if and only if
   * a user with that email exists in the database.
   */
  describe('Property 8: Email Existence Consistency', () => {
    it('should correctly check email existence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          async (nonExistentEmail, userData) => {
            // Ensure we're testing with different emails
            fc.pre(nonExistentEmail !== userData.email);

            try {
              // Non-existent email should return false
              const existsBefore = await userRepository.emailExists(nonExistentEmail);
              expect(existsBefore).toBe(false);

              // Create user
              const created = await userRepository.create(userData);

              // Created email should return true
              const existsAfter = await userRepository.emailExists(userData.email);
              expect(existsAfter).toBe(true);

              // Non-existent email should still return false
              const stillNotExists = await userRepository.emailExists(nonExistentEmail);
              expect(stillNotExists).toBe(false);

              // Verify consistency with findByEmail
              const foundUser = await userRepository.findByEmail(userData.email);
              expect(foundUser).not.toBeNull();
              expect(foundUser?.id).toBe(created.id);

              const notFoundUser = await userRepository.findByEmail(nonExistentEmail);
              expect(notFoundUser).toBeNull();
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 6.11: Property Test for Password Update Security
   * Property 25: Password Update Security
   * **Validates: Requirements 3.6**
   *
   * For all users and any new password hash, updatePassword() SHALL update only
   * the password_hash field and updated_at timestamp, leaving all other fields unchanged.
   */
  describe('Property 25: Password Update Security', () => {
    it('should update only password_hash and updated_at fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 60, maxLength: 60 }),
          async (userData, newPasswordHash) => {
            // Ensure new password is different
            fc.pre(newPasswordHash !== userData.password_hash);

            try {
              // Create user
              const created = await userRepository.create(userData);
              
              // Wait a small amount to ensure updated_at will change
              await new Promise(resolve => setTimeout(resolve, 10));

              // Update password
              await userRepository.updatePassword(created.id, newPasswordHash);

              // Retrieve updated user
              const updated = await userRepository.findById(created.id);
              expect(updated).not.toBeNull();

              // Verify password_hash was updated
              expect(updated?.password_hash).toBe(newPasswordHash);
              expect(updated?.password_hash).not.toBe(userData.password_hash);

              // Verify updated_at changed
              expect(updated?.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());

              // Verify all other fields remain unchanged
              expect(updated?.id).toBe(created.id);
              expect(updated?.email).toBe(created.email);
              expect(updated?.first_name).toBe(created.first_name);
              expect(updated?.last_name).toBe(created.last_name);
              expect(updated?.role).toBe(created.role);
              expect(updated?.is_active).toBe(created.is_active);
              expect(updated?.profile_image_url).toBe(created.profile_image_url);
              expect(updated?.bio).toBe(created.bio);
              expect(updated?.created_at.getTime()).toBe(created.created_at.getTime());
            } finally {
              // Clean up after each property test iteration
              await prisma.user.deleteMany({ where: { email: userData.email } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
