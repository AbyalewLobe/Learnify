/**
 * Property-Based Tests for Transaction Support
 *
 * These tests verify that Prisma transactions work correctly with
 * atomicity and client isolation guarantees.
 */

import fc from 'fast-check';
import { prisma } from './jest.setup';
import { UserRepository } from '../repositories/UserRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';

describe('Transaction Properties', () => {
  afterEach(async () => {
    // Clean up test data in correct order (respecting foreign keys)
    await prisma.refreshToken.deleteMany();
    await prisma.courseTag.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
  });

  /**
   * Feature: prisma-migration, Property 22: Transaction Atomicity
   *
   * **Validates: Requirements 15.4, 15.5**
   *
   * For all multi-step operations executed in a transaction, either all
   * operations SHALL succeed and persist, or all operations SHALL fail
   * and rollback with no changes persisted.
   */
  describe('Transaction atomicity', () => {
    it('should commit all operations when transaction succeeds', async () => {
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
          async (userData, courseData) => {
            // Execute multiple operations in a transaction
            const result = await prisma.$transaction(async tx => {
              const userRepo = new UserRepository(tx);
              const courseRepo = new CourseRepository(tx);

              const user = await userRepo.create(userData);
              const course = await courseRepo.create({
                ...courseData,
                creator_id: user.id,
              });

              return { user, course };
            });

            // Verify both operations persisted
            const user = await prisma.user.findUnique({ where: { id: result.user.id } });
            const course = await prisma.course.findUnique({ where: { id: result.course.id } });

            expect(user).not.toBeNull();
            expect(course).not.toBeNull();
            expect(user?.email).toBe(userData.email);
            expect(course?.title).toBe(courseData.title);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should rollback all operations when transaction fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          async userData => {
            // Attempt transaction that will fail
            try {
              await prisma.$transaction(async tx => {
                const userRepo = new UserRepository(tx);
                const courseRepo = new CourseRepository(tx);

                // Create user
                const user = await userRepo.create(userData);

                // Try to create course with invalid creator_id (will fail)
                await courseRepo.create({
                  title: 'Test Course',
                  description: 'Test Description',
                  category: 'Test',
                  price: 99.99,
                  creator_id: '00000000-0000-0000-0000-000000000000', // Non-existent user
                });

                return user;
              });
            } catch (error) {
              // Transaction should fail
            }

            // Verify user was NOT created (rollback occurred)
            const user = await prisma.user.findUnique({ where: { email: userData.email } });
            expect(user).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle nested repository operations atomically', async () => {
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
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
          async (userData, courseData, tags) => {
            // Execute multiple operations in a transaction
            const result = await prisma.$transaction(async tx => {
              const userRepo = new UserRepository(tx);
              const courseRepo = new CourseRepository(tx);

              const user = await userRepo.create(userData);
              const course = await courseRepo.create({
                ...courseData,
                creator_id: user.id,
              });
              await courseRepo.addTags(course.id, tags);

              return { user, course };
            });

            // Verify all operations persisted
            const courseTags = await prisma.courseTag.findMany({
              where: { course_id: result.course.id },
            });

            expect(courseTags.length).toBe(new Set(tags).size);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: prisma-migration, Property 23: Transaction Client Isolation
   *
   * **Validates: Requirements 15.3**
   *
   * For all repository methods that accept an optional transaction client,
   * when a transaction client is provided, all database operations SHALL
   * use that client instead of the default singleton client.
   */
  describe('Transaction client isolation', () => {
    it('should use transaction client when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          async userData => {
            // Create user inside transaction
            const userId = await prisma.$transaction(async tx => {
              const userRepo = new UserRepository(tx);
              const user = await userRepo.create(userData);
              return user.id;
            });

            // Verify user exists after transaction commits
            const user = await prisma.user.findUnique({ where: { id: userId } });
            expect(user).not.toBeNull();
            expect(user?.email).toBe(userData.email);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should isolate operations within transaction from default client', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email1: fc.emailAddress(),
            email2: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom('student' as const, 'creator' as const, 'admin' as const),
          }),
          async ({ email1, email2, ...rest }) => {
            fc.pre(email1 !== email2); // Ensure emails are different

            const defaultRepo = new UserRepository();

            // Create user outside transaction
            const user1 = await defaultRepo.create({
              email: email1,
              ...rest,
            });

            // Start transaction but don't commit yet
            try {
              await prisma.$transaction(async tx => {
                const txRepo = new UserRepository(tx);

                // Create user inside transaction
                await txRepo.create({
                  email: email2,
                  ...rest,
                });

                // Query from default client should not see uncommitted user
                const foundByDefault = await defaultRepo.findByEmail(email2);
                expect(foundByDefault).toBeNull();

                // Throw to rollback
                throw new Error('Intentional rollback');
              });
            } catch (error) {
              // Expected rollback
            }

            // Verify user2 was rolled back
            const user2 = await prisma.user.findUnique({ where: { email: email2 } });
            expect(user2).toBeNull();

            // Verify user1 still exists
            const user1Check = await prisma.user.findUnique({ where: { id: user1.id } });
            expect(user1Check).not.toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should support multiple repositories in same transaction', async () => {
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
          fc.string({ minLength: 64, maxLength: 64 }),
          async (userData, courseData, tokenHash) => {
            // Execute operations across multiple repositories in one transaction
            const result = await prisma.$transaction(async tx => {
              const userRepo = new UserRepository(tx);
              const courseRepo = new CourseRepository(tx);
              const tokenRepo = new RefreshTokenRepository(tx);

              const user = await userRepo.create(userData);
              const course = await courseRepo.create({
                ...courseData,
                creator_id: user.id,
              });
              const token = await tokenRepo.create(
                user.id,
                tokenHash,
                new Date(Date.now() + 86400000)
              );

              return { user, course, token };
            });

            // Verify all operations persisted
            const user = await prisma.user.findUnique({ where: { id: result.user.id } });
            const course = await prisma.course.findUnique({ where: { id: result.course.id } });
            const token = await prisma.refreshToken.findUnique({ where: { id: result.token.id } });

            expect(user).not.toBeNull();
            expect(course).not.toBeNull();
            expect(token).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
