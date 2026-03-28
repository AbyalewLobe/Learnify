import fc from 'fast-check';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaErrorHandler } from '../utils/prismaErrorHandler';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import { prisma } from '../config/prisma';

describe('PrismaErrorHandler Properties', () => {
  let testPrisma: PrismaClient;

  beforeAll(() => {
    testPrisma = prisma;
  });

  afterEach(async () => {
    // Clean up test data
    await testPrisma.user.deleteMany();
    await testPrisma.course.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  /**
   * Feature: prisma-migration, Property 18: Unique Constraint Error Mapping
   * For all repository operations that violate unique constraints, the repository
   * SHALL throw an error that the error handler maps to HTTP 409 Conflict.
   *
   * **Validates: Requirements 13.1, 13.5**
   */
  describe('Property 18: Unique Constraint Error Mapping', () => {
    it('should map unique constraint violations to ConflictError', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom(Role.student, Role.creator, Role.admin),
          }),
          async userData => {
            // Create first user
            await testPrisma.user.create({
              data: userData,
            });

            // Attempt to create duplicate user with same email
            let caughtError: any = null;
            try {
              await testPrisma.user.create({
                data: userData,
              });
            } catch (error) {
              caughtError = error;
            }

            // Should have caught an error
            expect(caughtError).not.toBeNull();

            // Handle the error with PrismaErrorHandler
            let handledError: any = null;
            try {
              PrismaErrorHandler.handle(caughtError);
            } catch (error) {
              handledError = error;
            }

            // Verify it's mapped to ConflictError
            expect(handledError).toBeInstanceOf(ConflictError);
            expect((handledError as ConflictError).statusCode).toBe(409);
            expect((handledError as ConflictError).code).toBe('CONFLICT');
            expect((handledError as ConflictError).message).toContain('already exists');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should consistently map P2002 errors to ConflictError across different models', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constantFrom(Role.student, Role.creator, Role.admin),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.integer({ min: 0, max: 9999 }),
          }),
          async (userData, courseData) => {
            // Create user first
            const user = await testPrisma.user.create({
              data: userData,
            });

            // Create course
            const course = await testPrisma.course.create({
              data: {
                ...courseData,
                creator_id: user.id,
              },
            });

            // Create a course tag
            await testPrisma.courseTag.create({
              data: {
                course_id: course.id,
                tag: 'test-tag',
              },
            });

            // Attempt to create duplicate course tag (violates unique constraint on course_id + tag)
            let caughtError: any = null;
            try {
              await testPrisma.courseTag.create({
                data: {
                  course_id: course.id,
                  tag: 'test-tag',
                },
              });
            } catch (error) {
              caughtError = error;
            }

            expect(caughtError).not.toBeNull();

            let handledError: any = null;
            try {
              PrismaErrorHandler.handle(caughtError);
            } catch (error) {
              handledError = error;
            }

            // Should be ConflictError for any unique constraint violation
            expect(handledError).toBeInstanceOf(ConflictError);
            expect((handledError as ConflictError).statusCode).toBe(409);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: prisma-migration, Property 19: Foreign Key Constraint Error Mapping
   * For all repository operations that violate foreign key constraints, the repository
   * SHALL throw an error that the error handler maps to HTTP 400 Bad Request.
   *
   * **Validates: Requirements 13.2, 13.5**
   */
  describe('Property 19: Foreign Key Constraint Error Mapping', () => {
    it('should map foreign key constraint violations to BadRequestError', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.integer({ min: 0, max: 9999 }),
          }),
          async (nonExistentUserId, courseData) => {
            // Attempt to create course with non-existent creator_id
            let caughtError: any = null;
            try {
              await testPrisma.course.create({
                data: {
                  ...courseData,
                  creator_id: nonExistentUserId,
                },
              });
            } catch (error) {
              caughtError = error;
            }

            expect(caughtError).not.toBeNull();

            // Handle the error with PrismaErrorHandler
            let handledError: any = null;
            try {
              PrismaErrorHandler.handle(caughtError);
            } catch (error) {
              handledError = error;
            }

            // Verify it's mapped to BadRequestError
            expect(handledError).toBeInstanceOf(BadRequestError);
            expect((handledError as BadRequestError).statusCode).toBe(400);
            expect((handledError as BadRequestError).code).toBe('BAD_REQUEST');
            expect((handledError as BadRequestError).message).toContain('Invalid reference');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should consistently map P2003 errors to BadRequestError across different relations', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), fc.uuid(), async (nonExistentCourseId, nonExistentUserId) => {
          // Attempt to create enrollment with non-existent course_id
          let caughtError: any = null;
          try {
            await testPrisma.enrollment.create({
              data: {
                student_id: nonExistentUserId,
                course_id: nonExistentCourseId,
              },
            });
          } catch (error) {
            caughtError = error;
          }

          expect(caughtError).not.toBeNull();

          let handledError: any = null;
          try {
            PrismaErrorHandler.handle(caughtError);
          } catch (error) {
            handledError = error;
          }

          // Should be BadRequestError for any foreign key violation
          expect(handledError).toBeInstanceOf(BadRequestError);
          expect((handledError as BadRequestError).statusCode).toBe(400);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Feature: prisma-migration, Property 20: Not Found Handling Consistency
   * For all repository find methods, when a record does not exist, the method
   * SHALL return null (for findById, findByEmail, findByHash) or empty array
   * (for findMany methods).
   *
   * **Validates: Requirements 13.3**
   */
  describe('Property 20: Not Found Handling Consistency', () => {
    it('should map P2025 errors (record not found) to NotFoundError for update/delete operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          async (nonExistentUserId, updateData) => {
            // Attempt to update non-existent user
            let caughtError: any = null;
            try {
              await testPrisma.user.update({
                where: { id: nonExistentUserId },
                data: updateData,
              });
            } catch (error) {
              caughtError = error;
            }

            expect(caughtError).not.toBeNull();

            // Handle the error with PrismaErrorHandler
            let handledError: any = null;
            try {
              PrismaErrorHandler.handle(caughtError);
            } catch (error) {
              handledError = error;
            }

            // Verify it's mapped to NotFoundError
            expect(handledError).toBeInstanceOf(NotFoundError);
            expect((handledError as NotFoundError).statusCode).toBe(404);
            expect((handledError as NotFoundError).code).toBe('NOT_FOUND');
            expect((handledError as NotFoundError).message).toContain('not found');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return null for findUnique operations on non-existent records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          async (nonExistentUserId, nonExistentEmail) => {
            // findUnique should return null, not throw
            const userById = await testPrisma.user.findUnique({
              where: { id: nonExistentUserId },
            });
            expect(userById).toBeNull();

            const userByEmail = await testPrisma.user.findUnique({
              where: { email: nonExistentEmail },
            });
            expect(userByEmail).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should consistently handle not found errors across delete operations', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async nonExistentCourseId => {
          // Attempt to delete non-existent course
          let caughtError: any = null;
          try {
            await testPrisma.course.delete({
              where: { id: nonExistentCourseId },
            });
          } catch (error) {
            caughtError = error;
          }

          expect(caughtError).not.toBeNull();

          let handledError: any = null;
          try {
            PrismaErrorHandler.handle(caughtError);
          } catch (error) {
            handledError = error;
          }

          // Should be NotFoundError
          expect(handledError).toBeInstanceOf(NotFoundError);
          expect((handledError as NotFoundError).statusCode).toBe(404);
        }),
        { numRuns: 20 }
      );
    });
  });
});
