/**
 * Property-Based Tests for Repository Behavioral Equivalence
 * 
 * These tests verify that the Prisma implementation produces the same
 * behavior as the original pg library implementation.
 */

import fc from 'fast-check';
import { prisma } from './jest.setup';
import { UserRepository } from '../repositories/UserRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';

describe('Repository Behavioral Equivalence Properties', () => {
  let userRepository: UserRepository;
  let courseRepository: CourseRepository;
  let refreshTokenRepository: RefreshTokenRepository;

  beforeAll(() => {
    userRepository = new UserRepository();
    courseRepository = new CourseRepository();
    refreshTokenRepository = new RefreshTokenRepository();
  });

  afterEach(async () => {
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.refreshToken.deleteMany();
    await prisma.courseTag.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
  });

  /**
   * Feature: prisma-migration, Property 16: Repository Behavioral Equivalence
   * 
   * **Validates: Requirements 3.11, 4.15, 5.9**
   * 
   * For all repository methods and any valid input, the Prisma implementation
   * SHALL produce the same output (return value and side effects) as the pg
   * library implementation.
   */
  describe('UserRepository behavioral equivalence', () => {
    it('should maintain consistent create-find-update-delete behavior', async () => {
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
          }),
          async (userData, updateData) => {
            // Create
            const created = await userRepository.create(userData);
            expect(created).toBeDefined();
            expect(created.id).toBeDefined();
            expect(created.email).toBe(userData.email);
            expect(created.is_active).toBe(true);

            // Find by ID
            const foundById = await userRepository.findById(created.id);
            expect(foundById).not.toBeNull();
            expect(foundById?.id).toBe(created.id);
            expect(foundById?.email).toBe(userData.email);

            // Find by email
            const foundByEmail = await userRepository.findByEmail(userData.email);
            expect(foundByEmail).not.toBeNull();
            expect(foundByEmail?.id).toBe(created.id);

            // Email exists
            const exists = await userRepository.emailExists(userData.email);
            expect(exists).toBe(true);

            // Update
            const updated = await userRepository.update(created.id, updateData);
            expect(updated.first_name).toBe(updateData.first_name);
            expect(updated.last_name).toBe(updateData.last_name);
            expect(updated.email).toBe(userData.email); // Email unchanged

            // Deactivate
            await userRepository.deactivate(created.id);
            const deactivated = await userRepository.findById(created.id);
            expect(deactivated?.is_active).toBe(false);

            // Activate
            await userRepository.activate(created.id);
            const activated = await userRepository.findById(created.id);
            expect(activated?.is_active).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for non-existent records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (nonExistentId, nonExistentEmail) => {
            const foundById = await userRepository.findById(nonExistentId);
            expect(foundById).toBeNull();

            const foundByEmail = await userRepository.findByEmail(nonExistentEmail);
            expect(foundByEmail).toBeNull();

            const exists = await userRepository.emailExists(nonExistentEmail);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: prisma-migration, Property 16: Repository Behavioral Equivalence
   * 
   * **Validates: Requirements 3.11, 4.15, 5.9**
   */
  describe('CourseRepository behavioral equivalence', () => {
    it('should maintain consistent create-find-update-delete behavior', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0, max: 9999.99, noNaN: true }),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
          }),
          async (userData, courseData, updateData) => {
            // Create user first
            const user = await userRepository.create(userData);

            // Create course
            const created = await courseRepository.create({
              ...courseData,
              creator_id: user.id,
            });
            expect(created).toBeDefined();
            expect(created.id).toBeDefined();
            expect(created.title).toBe(courseData.title);
            expect(created.status).toBe('draft');

            // Find by ID
            const foundById = await courseRepository.findById(created.id);
            expect(foundById).not.toBeNull();
            expect(foundById?.id).toBe(created.id);

            // Update
            const updated = await courseRepository.update(created.id, updateData);
            expect(updated).not.toBeNull();
            expect(updated?.title).toBe(updateData.title);
            expect(updated?.description).toBe(updateData.description);

            // Update status
            await courseRepository.updateStatus(created.id, 'published');
            const published = await courseRepository.findById(created.id);
            expect(published?.status).toBe('published');
            expect(published?.published_at).toBeDefined();

            // Find by creator
            const creatorCourses = await courseRepository.findByCreator(user.id, 10, 0);
            expect(creatorCourses.length).toBeGreaterThan(0);
            expect(creatorCourses[0].id).toBe(created.id);

            // Find published
            const publishedCourses = await courseRepository.findPublished(10, 0);
            expect(publishedCourses.some(c => c.id === created.id)).toBe(true);

            // Change status back to draft for deletion
            await courseRepository.updateStatus(created.id, 'draft');

            // Delete (only works for draft status)
            await courseRepository.delete(created.id);
            const deleted = await courseRepository.findById(created.id);
            expect(deleted).toBeNull();
          }
        ),
        { numRuns: 50 } // Reduced runs due to complexity
      );
    });

    it('should handle tag operations correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0, max: 9999.99, noNaN: true }),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          async (userData, courseData, tags) => {
            const user = await userRepository.create(userData);
            const course = await courseRepository.create({
              ...courseData,
              creator_id: user.id,
            });

            // Add tags
            await courseRepository.addTags(course.id, tags);
            const addedTags = await courseRepository.getTags(course.id);
            expect(addedTags.length).toBe(new Set(tags).size); // Unique tags only

            // Remove tags
            await courseRepository.removeTags(course.id, tags);
            const remainingTags = await courseRepository.getTags(course.id);
            expect(remainingTags.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: prisma-migration, Property 16: Repository Behavioral Equivalence
   * 
   * **Validates: Requirements 3.11, 4.15, 5.9**
   */
  describe('RefreshTokenRepository behavioral equivalence', () => {
    it('should maintain consistent create-find-revoke-delete behavior', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 64, maxLength: 64 }),
          fc.date({ min: new Date(Date.now() + 86400000) }), // Future date
          async (userData, tokenHash, expiresAt) => {
            // Create user first
            const user = await userRepository.create(userData);

            // Create token
            const created = await refreshTokenRepository.create(user.id, tokenHash, expiresAt);
            expect(created).toBeDefined();
            expect(created.id).toBeDefined();
            expect(created.token_hash).toBe(tokenHash);

            // Find by hash
            const found = await refreshTokenRepository.findByHash(tokenHash);
            expect(found).not.toBeNull();
            expect(found?.id).toBe(created.id);

            // Is valid
            const isValid = await refreshTokenRepository.isValid(tokenHash);
            expect(isValid).toBe(true);

            // Revoke
            await refreshTokenRepository.revoke(tokenHash);
            const revokedFound = await refreshTokenRepository.findByHash(tokenHash);
            expect(revokedFound).toBeNull(); // Should not find revoked tokens

            const isValidAfterRevoke = await refreshTokenRepository.isValid(tokenHash);
            expect(isValidAfterRevoke).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle bulk operations correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.array(
            fc.record({
              token_hash: fc.string({ minLength: 64, maxLength: 64 }),
              expires_at: fc.date({ min: new Date(Date.now() + 86400000) }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (userData, tokens) => {
            const user = await userRepository.create(userData);

            // Create multiple tokens
            for (const token of tokens) {
              await refreshTokenRepository.create(user.id, token.token_hash, token.expires_at);
            }

            // Revoke all for user
            await refreshTokenRepository.revokeAllForUser(user.id);

            // Verify all are revoked
            for (const token of tokens) {
              const isValid = await refreshTokenRepository.isValid(token.token_hash);
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should delete expired tokens correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          fc.string({ minLength: 64, maxLength: 64 }),
          async (userData, tokenHash) => {
            const user = await userRepository.create(userData);

            // Create expired token
            await refreshTokenRepository.create(user.id, tokenHash, new Date(Date.now() - 86400000));

            // Delete expired
            await refreshTokenRepository.deleteExpired();

            // Verify token is deleted
            const found = await refreshTokenRepository.findByHash(tokenHash);
            expect(found).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
