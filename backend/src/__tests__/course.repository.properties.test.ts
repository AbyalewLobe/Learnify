import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import { CourseRepository } from '../repositories/CourseRepository';
import { UserRepository } from '../repositories/UserRepository';

/**
 * Property-Based Tests for CourseRepository
 * Validates correctness properties for course repository operations
 */

describe('Property-Based Tests: CourseRepository', () => {
  let prisma: PrismaClient;
  let courseRepository: CourseRepository;
  let userRepository: UserRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    courseRepository = new CourseRepository(prisma);
    userRepository = new UserRepository(prisma);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Task 8.11: Property Test for Course Deletion Status Constraint
   * Property 9: Course Deletion Status Constraint
   * **Validates: Requirements 4.6**
   *
   * For all courses, delete() SHALL return true when status is 'draft',
   * and SHALL return false when status is 'pending', 'published', or 'rejected'.
   */
  describe('Property 9: Course Deletion Status Constraint', () => {
    it('should successfully delete courses with draft status', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          async (userData, courseData) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course with draft status (default)
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Verify course is in draft status
            expect(course.status).toBe('draft');

            // Delete should succeed for draft courses
            const deleteResult = await courseRepository.delete(course.id);
            expect(deleteResult).toBe(true);

            // Verify course is actually deleted
            const deletedCourse = await courseRepository.findById(course.id);
            expect(deletedCourse).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail to delete courses with non-draft status', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.constantFrom('pending' as const, 'published' as const, 'rejected' as const),
          async (userData, courseData, nonDraftStatus) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course with draft status (default)
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Update course to non-draft status
            await courseRepository.updateStatus(course.id, nonDraftStatus);

            // Verify course has non-draft status
            const updatedCourse = await courseRepository.findById(course.id);
            expect(updatedCourse).not.toBeNull();
            expect(updatedCourse?.status).toBe(nonDraftStatus);

            // Delete should fail for non-draft courses
            const deleteResult = await courseRepository.delete(course.id);
            expect(deleteResult).toBe(false);

            // Verify course still exists
            const stillExistingCourse = await courseRepository.findById(course.id);
            expect(stillExistingCourse).not.toBeNull();
            expect(stillExistingCourse?.id).toBe(course.id);
            expect(stillExistingCourse?.status).toBe(nonDraftStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify deletion constraint is enforced consistently', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.constantFrom(
            'draft' as const,
            'pending' as const,
            'published' as const,
            'rejected' as const
          ),
          async (userData, courseData, status) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Update to the specified status if not draft
            if (status !== 'draft') {
              await courseRepository.updateStatus(course.id, status);
            }

            // Verify course has the expected status
            const courseBeforeDelete = await courseRepository.findById(course.id);
            expect(courseBeforeDelete).not.toBeNull();
            expect(courseBeforeDelete?.status).toBe(status);

            // Attempt to delete
            const deleteResult = await courseRepository.delete(course.id);

            // Verify deletion result matches status constraint
            if (status === 'draft') {
              // Draft courses should be deleted successfully
              expect(deleteResult).toBe(true);
              const deletedCourse = await courseRepository.findById(course.id);
              expect(deletedCourse).toBeNull();
            } else {
              // Non-draft courses should not be deleted
              expect(deleteResult).toBe(false);
              const stillExistingCourse = await courseRepository.findById(course.id);
              expect(stillExistingCourse).not.toBeNull();
              expect(stillExistingCourse?.id).toBe(course.id);
              expect(stillExistingCourse?.status).toBe(status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 8.12: Property Test for Course Tag Addition Idempotence
   * Property 10: Course Tag Addition Idempotence
   * **Validates: Requirements 4.10**
   *
   * For all courses and any set of tags, adding the same tags multiple times
   * SHALL result in each tag appearing exactly once in the course's tag list.
   */
  describe('Property 10: Course Tag Addition Idempotence', () => {
    it('should ensure tags appear exactly once regardless of how many times they are added', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 2, max: 5 }),
          async (userData, courseData, tags, addCount) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add the same tags multiple times
            for (let i = 0; i < addCount; i++) {
              await courseRepository.addTags(course.id, tags);
            }

            // Get the tags
            const retrievedTags = await courseRepository.getTags(course.id);

            // Each unique tag should appear exactly once
            const uniqueTags = [...new Set(tags)];
            expect(retrievedTags.length).toBe(uniqueTags.length);

            // Verify all unique tags are present
            for (const tag of uniqueTags) {
              expect(retrievedTags).toContain(tag);
            }

            // Verify no duplicates exist
            const tagSet = new Set(retrievedTags);
            expect(tagSet.size).toBe(retrievedTags.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle adding tags incrementally with overlapping sets', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          async (userData, courseData, tagsSet1, tagsSet2) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add first set of tags
            await courseRepository.addTags(course.id, tagsSet1);

            // Add second set of tags (may overlap with first set)
            await courseRepository.addTags(course.id, tagsSet2);

            // Add first set again
            await courseRepository.addTags(course.id, tagsSet1);

            // Get the tags
            const retrievedTags = await courseRepository.getTags(course.id);

            // Calculate expected unique tags
            const allTags = [...tagsSet1, ...tagsSet2];
            const uniqueTags = [...new Set(allTags)];

            // Each unique tag should appear exactly once
            expect(retrievedTags.length).toBe(uniqueTags.length);

            // Verify all unique tags are present
            for (const tag of uniqueTags) {
              expect(retrievedTags).toContain(tag);
            }

            // Verify no duplicates exist
            const tagSet = new Set(retrievedTags);
            expect(tagSet.size).toBe(retrievedTags.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain idempotence with empty tag arrays', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          async (userData, courseData, tags) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add tags
            await courseRepository.addTags(course.id, tags);

            // Get tags after first add
            const tagsAfterFirstAdd = await courseRepository.getTags(course.id);

            // Add empty array (should not change anything)
            await courseRepository.addTags(course.id, []);

            // Get tags after empty add
            const tagsAfterEmptyAdd = await courseRepository.getTags(course.id);

            // Tags should remain the same
            expect(tagsAfterEmptyAdd).toEqual(tagsAfterFirstAdd);

            // Add the same tags again
            await courseRepository.addTags(course.id, tags);

            // Get tags after second add
            const tagsAfterSecondAdd = await courseRepository.getTags(course.id);

            // Tags should still be the same (idempotent)
            expect(tagsAfterSecondAdd.sort()).toEqual(tagsAfterFirstAdd.sort());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 8.13: Property Test for Course Tag Removal Completeness
   * Property 11: Course Tag Removal Completeness
   * **Validates: Requirements 4.11, 4.12**
   *
   * For all courses with tags, removing a set of tags SHALL result in none of
   * those tags appearing in getTags() results.
   */
  describe('Property 11: Course Tag Removal Completeness', () => {
    it('should completely remove all specified tags from a course', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 10 }),
          async (userData, courseData, tags) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add all tags to the course
            await courseRepository.addTags(course.id, tags);

            // Verify all tags were added
            const tagsBeforeRemoval = await courseRepository.getTags(course.id);
            const uniqueTags = [...new Set(tags)];
            expect(tagsBeforeRemoval.length).toBe(uniqueTags.length);

            // Select a subset of tags to remove (at least 1, at most all)
            const numToRemove = Math.max(1, Math.floor(uniqueTags.length / 2));
            const tagsToRemove = uniqueTags.slice(0, numToRemove);
            const tagsToKeep = uniqueTags.slice(numToRemove);

            // Remove the selected tags
            await courseRepository.removeTags(course.id, tagsToRemove);

            // Get remaining tags
            const remainingTags = await courseRepository.getTags(course.id);

            // Verify none of the removed tags appear in the results
            for (const removedTag of tagsToRemove) {
              expect(remainingTags).not.toContain(removedTag);
            }

            // Verify all tags that should remain are still present
            for (const keptTag of tagsToKeep) {
              expect(remainingTags).toContain(keptTag);
            }

            // Verify the count is correct
            expect(remainingTags.length).toBe(tagsToKeep.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removing all tags from a course', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          async (userData, courseData, tags) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add all tags to the course
            await courseRepository.addTags(course.id, tags);

            // Verify tags were added
            const tagsBeforeRemoval = await courseRepository.getTags(course.id);
            expect(tagsBeforeRemoval.length).toBeGreaterThan(0);

            // Remove all tags
            const uniqueTags = [...new Set(tags)];
            await courseRepository.removeTags(course.id, uniqueTags);

            // Get remaining tags
            const remainingTags = await courseRepository.getTags(course.id);

            // Verify no tags remain
            expect(remainingTags).toEqual([]);
            expect(remainingTags.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removing non-existent tags gracefully', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          async (userData, courseData, existingTags, nonExistentTags) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add only the existing tags
            await courseRepository.addTags(course.id, existingTags);

            // Get tags before removal
            const tagsBeforeRemoval = await courseRepository.getTags(course.id);
            const uniqueExistingTags = [...new Set(existingTags)];
            expect(tagsBeforeRemoval.length).toBe(uniqueExistingTags.length);

            // Try to remove non-existent tags
            await courseRepository.removeTags(course.id, nonExistentTags);

            // Get tags after removal attempt
            const tagsAfterRemoval = await courseRepository.getTags(course.id);

            // Verify existing tags are still present (unless they overlap with nonExistentTags)
            const overlappingTags = existingTags.filter(tag => nonExistentTags.includes(tag));
            const expectedRemainingTags = existingTags.filter(tag => !nonExistentTags.includes(tag));
            const uniqueExpectedRemaining = [...new Set(expectedRemainingTags)];

            expect(tagsAfterRemoval.length).toBe(uniqueExpectedRemaining.length);

            // Verify all expected remaining tags are present
            for (const tag of uniqueExpectedRemaining) {
              expect(tagsAfterRemoval).toContain(tag);
            }

            // Verify overlapping tags were removed
            for (const tag of overlappingTags) {
              expect(tagsAfterRemoval).not.toContain(tag);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removing empty tag array without errors', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          async (userData, courseData, tags) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Add tags
            await courseRepository.addTags(course.id, tags);

            // Get tags before removal
            const tagsBeforeRemoval = await courseRepository.getTags(course.id);

            // Remove empty array (should not change anything)
            await courseRepository.removeTags(course.id, []);

            // Get tags after removal
            const tagsAfterRemoval = await courseRepository.getTags(course.id);

            // Verify tags remain unchanged
            expect(tagsAfterRemoval.sort()).toEqual(tagsBeforeRemoval.sort());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure getTags returns current list after multiple add and remove operations', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 5, maxLength: 10 }),
          async (userData, courseData, tags) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            const uniqueTags = [...new Set(tags)];

            // Add all tags
            await courseRepository.addTags(course.id, uniqueTags);

            // Split tags into three groups
            const third = Math.floor(uniqueTags.length / 3);
            const group1 = uniqueTags.slice(0, third);
            const group2 = uniqueTags.slice(third, third * 2);
            const group3 = uniqueTags.slice(third * 2);

            // Remove first group
            await courseRepository.removeTags(course.id, group1);
            let currentTags = await courseRepository.getTags(course.id);
            expect(currentTags.length).toBe(uniqueTags.length - group1.length);
            for (const tag of group1) {
              expect(currentTags).not.toContain(tag);
            }

            // Add first group back
            await courseRepository.addTags(course.id, group1);
            currentTags = await courseRepository.getTags(course.id);
            expect(currentTags.length).toBe(uniqueTags.length);

            // Remove second group
            await courseRepository.removeTags(course.id, group2);
            currentTags = await courseRepository.getTags(course.id);
            expect(currentTags.length).toBe(uniqueTags.length - group2.length);
            for (const tag of group2) {
              expect(currentTags).not.toContain(tag);
            }

            // Remove third group
            await courseRepository.removeTags(course.id, group3);
            currentTags = await courseRepository.getTags(course.id);
            
            // Only group1 should remain
            expect(currentTags.length).toBe(group1.length);
            for (const tag of group1) {
              expect(currentTags).toContain(tag);
            }
            for (const tag of [...group2, ...group3]) {
              expect(currentTags).not.toContain(tag);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 8.14: Property Test for Course Content Existence Check
   * Property 12: Course Content Existence Check
   * **Validates: Requirements 4.13**
   *
   * For all courses, hasChaptersAndLessons() SHALL return true if the course has
   * at least one chapter with at least one lesson, and SHALL return false otherwise.
   */
  describe('Property 12: Course Content Existence Check', () => {
    it('should return false for courses with no chapters', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          async (userData, courseData) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course with no chapters
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // hasChaptersAndLessons should return false for courses with no chapters
            const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
            expect(hasContent).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for courses with chapters but no lessons', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 255 }),
              description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
              order_index: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (userData, courseData, chaptersData) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Create chapters without lessons
            for (const chapterData of chaptersData) {
              await prisma.chapter.create({
                data: {
                  course_id: course.id,
                  title: chapterData.title,
                  description: chapterData.description,
                  order_index: chapterData.order_index,
                },
              });
            }

            // hasChaptersAndLessons should return false for courses with chapters but no lessons
            const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
            expect(hasContent).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return true for courses with chapters and lessons', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(
            fc.record({
              chapterTitle: fc.string({ minLength: 1, maxLength: 255 }),
              chapterDescription: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
              chapterOrderIndex: fc.integer({ min: 0, max: 100 }),
              lessons: fc.array(
                fc.record({
                  title: fc.string({ minLength: 1, maxLength: 255 }),
                  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
                  lesson_type: fc.constantFrom('video' as const, 'quiz' as const, 'reading' as const, 'assignment' as const),
                  order_index: fc.integer({ min: 0, max: 100 }),
                }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (userData, courseData, chaptersWithLessons) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Create chapters with lessons
            for (const chapterData of chaptersWithLessons) {
              const chapter = await prisma.chapter.create({
                data: {
                  course_id: course.id,
                  title: chapterData.chapterTitle,
                  description: chapterData.chapterDescription,
                  order_index: chapterData.chapterOrderIndex,
                },
              });

              // Create lessons for this chapter
              for (const lessonData of chapterData.lessons) {
                await prisma.lesson.create({
                  data: {
                    chapter_id: chapter.id,
                    title: lessonData.title,
                    description: lessonData.description,
                    lesson_type: lessonData.lesson_type,
                    order_index: lessonData.order_index,
                  },
                });
              }
            }

            // hasChaptersAndLessons should return true for courses with chapters and lessons
            const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
            expect(hasContent).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify consistency across multiple courses with varying content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 255 }),
              description: fc.string({ minLength: 1, maxLength: 1000 }),
              category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
              price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
              hasChapters: fc.boolean(),
              hasLessons: fc.boolean(),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (userData, coursesData) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create multiple courses with varying content
            for (const courseData of coursesData) {
              const course = await courseRepository.create({
                creator_id: user.id,
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                price: courseData.price,
              });

              let expectedResult = false;

              if (courseData.hasChapters) {
                // Create a chapter
                const chapter = await prisma.chapter.create({
                  data: {
                    course_id: course.id,
                    title: 'Test Chapter',
                    order_index: 0,
                  },
                });

                if (courseData.hasLessons) {
                  // Create a lesson
                  await prisma.lesson.create({
                    data: {
                      chapter_id: chapter.id,
                      title: 'Test Lesson',
                      lesson_type: 'video',
                      order_index: 0,
                    },
                  });
                  expectedResult = true;
                }
              }

              // Verify hasChaptersAndLessons returns the expected result
              const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
              expect(hasContent).toBe(expectedResult);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge case of multiple chapters where only some have lessons', async () => {
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
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          async (userData, courseData, emptyChaptersCount, chaptersWithLessonsCount) => {
            // Create a user (creator)
            const user = await userRepository.create(userData);

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Create empty chapters (no lessons)
            for (let i = 0; i < emptyChaptersCount; i++) {
              await prisma.chapter.create({
                data: {
                  course_id: course.id,
                  title: `Empty Chapter ${i + 1}`,
                  order_index: i,
                },
              });
            }

            // Create chapters with lessons
            for (let i = 0; i < chaptersWithLessonsCount; i++) {
              const chapter = await prisma.chapter.create({
                data: {
                  course_id: course.id,
                  title: `Chapter with Lessons ${i + 1}`,
                  order_index: emptyChaptersCount + i,
                },
              });

              // Add at least one lesson to this chapter
              await prisma.lesson.create({
                data: {
                  chapter_id: chapter.id,
                  title: `Lesson ${i + 1}`,
                  lesson_type: 'video',
                  order_index: 0,
                },
              });
            }

            // hasChaptersAndLessons should return true because at least one chapter has lessons
            const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
            expect(hasContent).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 8.15: Property Test for Nested Relation Loading Completeness
   * Property 24: Nested Relation Loading Completeness
   * **Validates: Requirements 4.4**
   *
   * For all courses with nested relations, findByIdWithDetails() SHALL return
   * all chapters with their lessons ordered by order_index, and all tags.
   */
  describe('Property 24: Nested Relation Loading Completeness', () => {
    it('should load all chapters with lessons ordered by order_index', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(
            fc.record({
              chapterTitle: fc.string({ minLength: 1, maxLength: 255 }),
              chapterDescription: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
              chapterOrderIndex: fc.integer({ min: 0, max: 100 }),
              lessons: fc.array(
                fc.record({
                  title: fc.string({ minLength: 1, maxLength: 255 }),
                  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
                  lesson_type: fc.constantFrom('video' as const, 'quiz' as const, 'reading' as const, 'assignment' as const),
                  order_index: fc.integer({ min: 0, max: 100 }),
                  duration_minutes: fc.option(fc.integer({ min: 1, max: 300 }), { nil: null }),
                  is_preview: fc.boolean(),
                }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
          async (uuid, userData, courseData, chaptersWithLessons, tags) => {
            // Create a user (creator) with unique email (add timestamp to ensure uniqueness during shrinking)
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}-${Date.now()}-${Math.random()}@test.com`,
            });

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Create chapters with lessons
            const createdChapters = [];
            for (const chapterData of chaptersWithLessons) {
              const chapter = await prisma.chapter.create({
                data: {
                  course_id: course.id,
                  title: chapterData.chapterTitle,
                  description: chapterData.chapterDescription,
                  order_index: chapterData.chapterOrderIndex,
                },
              });

              // Create lessons for this chapter
              const createdLessons = [];
              for (const lessonData of chapterData.lessons) {
                const lesson = await prisma.lesson.create({
                  data: {
                    chapter_id: chapter.id,
                    title: lessonData.title,
                    description: lessonData.description,
                    lesson_type: lessonData.lesson_type,
                    order_index: lessonData.order_index,
                    duration_minutes: lessonData.duration_minutes,
                    is_preview: lessonData.is_preview,
                  },
                });
                createdLessons.push(lesson);
              }

              createdChapters.push({
                ...chapter,
                lessons: createdLessons,
              });
            }

            // Add tags if any
            if (tags.length > 0) {
              await courseRepository.addTags(course.id, tags);
            }

            // Load course with details
            const courseWithDetails = await courseRepository.findByIdWithDetails(course.id);

            // Verify course was loaded
            expect(courseWithDetails).not.toBeNull();
            expect(courseWithDetails.id).toBe(course.id);

            // Verify all chapters are loaded
            expect(courseWithDetails.chapters.length).toBe(createdChapters.length);

            // Sort created chapters by order_index for comparison
            const sortedCreatedChapters = [...createdChapters].sort(
              (a, b) => a.order_index - b.order_index
            );

            // Verify chapters are ordered by order_index
            for (let i = 0; i < courseWithDetails.chapters.length; i++) {
              const loadedChapter = courseWithDetails.chapters[i];
              const expectedChapter = sortedCreatedChapters[i];

              expect(loadedChapter.id).toBe(expectedChapter.id);
              expect(loadedChapter.title).toBe(expectedChapter.title);
              expect(loadedChapter.order_index).toBe(expectedChapter.order_index);

              // Verify all lessons are loaded for this chapter
              expect(loadedChapter.lessons.length).toBe(expectedChapter.lessons.length);

              // Sort expected lessons by order_index for comparison
              const sortedExpectedLessons = [...expectedChapter.lessons].sort(
                (a, b) => a.order_index - b.order_index
              );

              // Verify lessons are ordered by order_index
              for (let j = 0; j < loadedChapter.lessons.length; j++) {
                const loadedLesson = loadedChapter.lessons[j];
                const expectedLesson = sortedExpectedLessons[j];

                expect(loadedLesson.id).toBe(expectedLesson.id);
                expect(loadedLesson.title).toBe(expectedLesson.title);
                expect(loadedLesson.lesson_type).toBe(expectedLesson.lesson_type);
                expect(loadedLesson.order_index).toBe(expectedLesson.order_index);
                expect(loadedLesson.is_preview).toBe(expectedLesson.is_preview);
              }
            }

            // Verify all tags are loaded
            const uniqueTags = [...new Set(tags)];
            expect(courseWithDetails.tags.length).toBe(uniqueTags.length);
            for (const tag of uniqueTags) {
              expect(courseWithDetails.tags).toContain(tag);
            }
          }
        ),
        { numRuns: 20 } // Reduced runs due to complex nested structure creation
      );
    }, 60000); // Increased timeout for complex nested structure creation

    it('should handle courses with no chapters or tags', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          async (uuid, userData, courseData) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course with no chapters or tags
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Load course with details
            const courseWithDetails = await courseRepository.findByIdWithDetails(course.id);

            // Verify course was loaded
            expect(courseWithDetails).not.toBeNull();
            expect(courseWithDetails.id).toBe(course.id);

            // Verify empty chapters and tags arrays
            expect(courseWithDetails.chapters).toEqual([]);
            expect(courseWithDetails.tags).toEqual([]);

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify lesson ordering within each chapter is independent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.integer({ min: 2, max: 4 }),
          fc.integer({ min: 2, max: 5 }),
          async (uuid, userData, courseData, numChapters, lessonsPerChapter) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Create chapters with lessons, using random order_index values
            const createdChapters = [];
            for (let i = 0; i < numChapters; i++) {
              // Use random order_index for chapters
              const chapterOrderIndex = Math.floor(Math.random() * 1000);
              
              const chapter = await prisma.chapter.create({
                data: {
                  course_id: course.id,
                  title: `Chapter ${i + 1}`,
                  order_index: chapterOrderIndex,
                },
              });

              // Create lessons with random order_index values
              const createdLessons = [];
              for (let j = 0; j < lessonsPerChapter; j++) {
                const lessonOrderIndex = Math.floor(Math.random() * 1000);
                
                const lesson = await prisma.lesson.create({
                  data: {
                    chapter_id: chapter.id,
                    title: `Lesson ${j + 1}`,
                    lesson_type: 'video',
                    order_index: lessonOrderIndex,
                  },
                });
                createdLessons.push(lesson);
              }

              createdChapters.push({
                ...chapter,
                lessons: createdLessons,
              });
            }

            // Load course with details
            const courseWithDetails = await courseRepository.findByIdWithDetails(course.id);

            // Verify chapters are ordered by order_index
            for (let i = 1; i < courseWithDetails.chapters.length; i++) {
              expect(courseWithDetails.chapters[i].order_index).toBeGreaterThanOrEqual(
                courseWithDetails.chapters[i - 1].order_index
              );
            }

            // Verify lessons within each chapter are ordered by order_index
            for (const chapter of courseWithDetails.chapters) {
              for (let i = 1; i < chapter.lessons.length; i++) {
                expect(chapter.lessons[i].order_index).toBeGreaterThanOrEqual(
                  chapter.lessons[i - 1].order_index
                );
              }
            }

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should load complete nested structure with all fields present', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          async (uuid, userData, courseData) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Create a chapter with a lesson
            const chapter = await prisma.chapter.create({
              data: {
                course_id: course.id,
                title: 'Test Chapter',
                description: 'Test Description',
                order_index: 0,
              },
            });

            const lesson = await prisma.lesson.create({
              data: {
                chapter_id: chapter.id,
                title: 'Test Lesson',
                description: 'Test Lesson Description',
                lesson_type: 'video',
                order_index: 0,
                duration_minutes: 30,
                is_preview: true,
              },
            });

            // Add tags
            await courseRepository.addTags(course.id, ['tag1', 'tag2', 'tag3']);

            // Load course with details
            const courseWithDetails = await courseRepository.findByIdWithDetails(course.id);

            // Verify all course fields are present
            expect(courseWithDetails).not.toBeNull();
            expect(courseWithDetails.id).toBe(course.id);
            expect(courseWithDetails.title).toBe(course.title);
            expect(courseWithDetails.description).toBe(course.description);

            // Verify chapter structure
            expect(courseWithDetails.chapters).toHaveLength(1);
            const loadedChapter = courseWithDetails.chapters[0];
            expect(loadedChapter.id).toBe(chapter.id);
            expect(loadedChapter.title).toBe(chapter.title);
            expect(loadedChapter.description).toBe(chapter.description);
            expect(loadedChapter.order_index).toBe(chapter.order_index);

            // Verify lesson structure with all fields
            expect(loadedChapter.lessons).toHaveLength(1);
            const loadedLesson = loadedChapter.lessons[0];
            expect(loadedLesson.id).toBe(lesson.id);
            expect(loadedLesson.title).toBe(lesson.title);
            expect(loadedLesson.description).toBe(lesson.description);
            expect(loadedLesson.lesson_type).toBe(lesson.lesson_type);
            expect(loadedLesson.order_index).toBe(lesson.order_index);
            expect(loadedLesson.duration_minutes).toBe(lesson.duration_minutes);
            expect(loadedLesson.is_preview).toBe(lesson.is_preview);

            // Verify tags
            expect(courseWithDetails.tags).toHaveLength(3);
            expect(courseWithDetails.tags).toContain('tag1');
            expect(courseWithDetails.tags).toContain('tag2');
            expect(courseWithDetails.tags).toContain('tag3');

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 8.16: Property Test for Course Status Update Side Effects
   * Property 26: Course Status Update Side Effects
   * **Validates: Requirements 4.9**
   *
   * For all courses, when updateStatus() changes status to 'published',
   * published_at SHALL be set to current timestamp; for any other status,
   * published_at SHALL remain unchanged.
   */
  describe('Property 26: Course Status Update Side Effects', () => {
    it('should set published_at when status changes to published', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          async (uuid, userData, courseData) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course (starts in draft status)
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Verify initial state - published_at should be undefined/null
            expect(course.published_at).toBeUndefined();

            // Record time before status update
            const beforeUpdate = new Date();

            // Update status to published
            const updatedCourse = await courseRepository.updateStatus(course.id, 'published');

            // Record time after status update
            const afterUpdate = new Date();

            // Verify status was updated
            expect(updatedCourse).not.toBeNull();
            expect(updatedCourse?.status).toBe('published');

            // Verify published_at was set
            expect(updatedCourse?.published_at).toBeDefined();
            expect(updatedCourse?.published_at).not.toBeNull();

            // Verify published_at is a recent timestamp (within a few seconds of now)
            const publishedAt = updatedCourse?.published_at;
            expect(publishedAt).toBeInstanceOf(Date);
            expect(publishedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime() - 1000);
            expect(publishedAt!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime() + 1000);

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change published_at when status changes to non-published status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.constantFrom('draft' as const, 'pending' as const, 'rejected' as const),
          async (uuid, userData, courseData, nonPublishedStatus) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course (starts in draft status)
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Verify initial state - published_at should be undefined/null
            expect(course.published_at).toBeUndefined();

            // Update status to non-published status
            const updatedCourse = await courseRepository.updateStatus(
              course.id,
              nonPublishedStatus,
              nonPublishedStatus === 'rejected' ? 'Test rejection reason' : undefined
            );

            // Verify status was updated
            expect(updatedCourse).not.toBeNull();
            expect(updatedCourse?.status).toBe(nonPublishedStatus);

            // Verify published_at remains undefined/null
            expect(updatedCourse?.published_at).toBeUndefined();

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve published_at when transitioning from published to another status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.constantFrom('draft' as const, 'pending' as const, 'rejected' as const),
          async (uuid, userData, courseData, targetStatus) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // First, publish the course
            const publishedCourse = await courseRepository.updateStatus(course.id, 'published');
            expect(publishedCourse?.status).toBe('published');
            expect(publishedCourse?.published_at).toBeDefined();

            // Store the original published_at timestamp
            const originalPublishedAt = publishedCourse?.published_at;

            // Wait a small amount to ensure timestamps would differ if changed
            await new Promise(resolve => setTimeout(resolve, 10));

            // Change status to a non-published status
            const updatedCourse = await courseRepository.updateStatus(
              course.id,
              targetStatus,
              targetStatus === 'rejected' ? 'Test rejection reason' : undefined
            );

            // Verify status was updated
            expect(updatedCourse).not.toBeNull();
            expect(updatedCourse?.status).toBe(targetStatus);

            // Verify published_at was NOT changed (preserved from when it was published)
            expect(updatedCourse?.published_at).toBeDefined();
            expect(updatedCourse?.published_at?.getTime()).toBe(originalPublishedAt?.getTime());

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple status transitions correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.array(
            fc.constantFrom('draft' as const, 'pending' as const, 'published' as const, 'rejected' as const),
            { minLength: 2, maxLength: 5 }
          ),
          async (uuid, userData, courseData, statusSequence) => {
            const email = `${uuid}@test.com`;
            
            // Clean up any existing data with this email first (in case of shrinking)
            await prisma.user.deleteMany({ where: { email } });
            
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email,
            });

            try {
              // Create a course
              const course = await courseRepository.create({
                creator_id: user.id,
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                price: courseData.price,
              });

              let hasBeenPublished = false;
              let previousPublishedAt: Date | undefined = undefined;

              // Apply each status transition in sequence
              for (const status of statusSequence) {
                const beforeUpdate = new Date();
                
                const updatedCourse = await courseRepository.updateStatus(
                  course.id,
                  status,
                  status === 'rejected' ? 'Test rejection reason' : undefined
                );

                const afterUpdate = new Date();

                expect(updatedCourse).not.toBeNull();
                expect(updatedCourse?.status).toBe(status);

                if (status === 'published') {
                  // When transitioning to published, published_at should be set to current timestamp
                  expect(updatedCourse?.published_at).toBeDefined();
                  expect(updatedCourse?.published_at).toBeInstanceOf(Date);
                  
                  // Verify it's a recent timestamp
                  const publishedAt = updatedCourse?.published_at!;
                  expect(publishedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime() - 1000);
                  expect(publishedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime() + 1000);
                  
                  // If this is a re-publish, the timestamp should be different (newer) than before
                  if (hasBeenPublished && previousPublishedAt) {
                    // The new timestamp should be at least as recent as the previous one
                    expect(publishedAt.getTime()).toBeGreaterThanOrEqual(previousPublishedAt.getTime());
                  }
                  
                  hasBeenPublished = true;
                  previousPublishedAt = publishedAt;
                } else {
                  // When transitioning to non-published status
                  if (hasBeenPublished) {
                    // If previously published, published_at should be preserved (not changed)
                    expect(updatedCourse?.published_at).toBeDefined();
                    expect(updatedCourse?.published_at?.getTime()).toBe(previousPublishedAt?.getTime());
                  } else {
                    // If never published, published_at should remain undefined
                    expect(updatedCourse?.published_at).toBeUndefined();
                  }
                }
                
                // Small delay between transitions
                await new Promise(resolve => setTimeout(resolve, 10));
              }

              // Cleanup for this iteration
              await prisma.course.deleteMany({ where: { id: course.id } });
            } finally {
              // Always clean up user, even if test fails
              await prisma.user.deleteMany({ where: { id: user.id } });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set rejection_reason when status is rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 255 }),
            description: fc.string({ minLength: 1, maxLength: 1000 }),
            category: fc.constantFrom('programming', 'design', 'business', 'marketing'),
            price: fc.integer({ min: 0, max: 99999 }).map(n => n / 100),
          }),
          fc.string({ minLength: 1, maxLength: 500 }),
          async (uuid, userData, courseData, rejectionReason) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create a course
            const course = await courseRepository.create({
              creator_id: user.id,
              title: courseData.title,
              description: courseData.description,
              category: courseData.category,
              price: courseData.price,
            });

            // Update status to rejected with a reason
            const updatedCourse = await courseRepository.updateStatus(
              course.id,
              'rejected',
              rejectionReason
            );

            // Verify status and rejection reason
            expect(updatedCourse).not.toBeNull();
            expect(updatedCourse?.status).toBe('rejected');
            expect(updatedCourse?.rejection_reason).toBe(rejectionReason);

            // Verify published_at remains undefined for rejected courses
            expect(updatedCourse?.published_at).toBeUndefined();

            // Cleanup for this iteration
            await prisma.course.deleteMany({ where: { id: course.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Task 8.17: Property Test for Pagination Consistency
   * Property 21: Pagination Consistency
   * **Validates: Requirements 4.7, 4.8, 14.6**
   *
   * For all paginated repository methods (findByCreator, findPublished) and any
   * limit/offset values, the results SHALL contain at most 'limit' items starting
   * from 'offset' position in the ordered result set.
   */
  describe('Property 21: Pagination Consistency', () => {
    it('should return at most limit items for findByCreator', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 5, max: 15 }), // Number of courses to create
          fc.integer({ min: 1, max: 10 }), // Limit
          fc.integer({ min: 0, max: 10 }), // Offset
          async (uuid, userData, numCourses, limit, offset) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create multiple courses for this creator
            for (let i = 0; i < numCourses; i++) {
              await courseRepository.create({
                creator_id: user.id,
                title: `Course ${i + 1}`,
                description: `Description for course ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });
              // Small delay to ensure different created_at timestamps
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Fetch courses with pagination
            const paginatedCourses = await courseRepository.findByCreator(
              user.id,
              limit,
              offset
            );

            // Verify result count is at most limit
            expect(paginatedCourses.length).toBeLessThanOrEqual(limit);

            // Verify result count matches expected (considering offset and total)
            const expectedCount = Math.max(0, Math.min(limit, numCourses - offset));
            expect(paginatedCourses.length).toBe(expectedCount);

            // Verify courses are ordered by created_at desc
            for (let i = 1; i < paginatedCourses.length; i++) {
              expect(paginatedCourses[i].created_at.getTime()).toBeLessThanOrEqual(
                paginatedCourses[i - 1].created_at.getTime()
              );
            }

            // Verify all returned courses belong to the creator
            for (const course of paginatedCourses) {
              expect(course.creator_id).toBe(user.id);
            }

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);

    it('should return at most limit items for findPublished', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 5, max: 15 }), // Number of published courses to create
          fc.integer({ min: 1, max: 10 }), // Limit
          fc.integer({ min: 0, max: 10 }), // Offset
          async (uuid, userData, numPublishedCourses, limit, offset) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create multiple published courses
            for (let i = 0; i < numPublishedCourses; i++) {
              const course = await courseRepository.create({
                creator_id: user.id,
                title: `Published Course ${i + 1}`,
                description: `Description for published course ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });

              // Publish the course
              await courseRepository.updateStatus(course.id, 'published');
              
              // Small delay to ensure different published_at timestamps
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Fetch published courses with pagination
            const paginatedCourses = await courseRepository.findPublished(limit, offset);

            // Verify result count is at most limit
            expect(paginatedCourses.length).toBeLessThanOrEqual(limit);

            // Verify result count matches expected (considering offset and total)
            const expectedCount = Math.max(0, Math.min(limit, numPublishedCourses - offset));
            expect(paginatedCourses.length).toBe(expectedCount);

            // Verify courses are ordered by published_at desc
            for (let i = 1; i < paginatedCourses.length; i++) {
              const current = paginatedCourses[i].published_at;
              const previous = paginatedCourses[i - 1].published_at;
              
              expect(current).toBeDefined();
              expect(previous).toBeDefined();
              expect(current!.getTime()).toBeLessThanOrEqual(previous!.getTime());
            }

            // Verify all returned courses are published
            for (const course of paginatedCourses) {
              expect(course.status).toBe('published');
              expect(course.published_at).toBeDefined();
            }

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);

    it('should correctly skip offset items for findByCreator', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 8, max: 12 }), // Number of courses to create
          async (uuid, userData, numCourses) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create multiple courses
            for (let i = 0; i < numCourses; i++) {
              await courseRepository.create({
                creator_id: user.id,
                title: `Course ${i + 1}`,
                description: `Description ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });
              // Small delay to ensure different created_at timestamps
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Fetch all courses without pagination
            const allCourses = await courseRepository.findByCreator(user.id, 100, 0);

            // Test various offset values
            for (let offset = 0; offset < numCourses; offset += 3) {
              const paginatedCourses = await courseRepository.findByCreator(
                user.id,
                5,
                offset
              );

              // Verify the first item in paginated result matches the item at offset in full list
              if (offset < allCourses.length && paginatedCourses.length > 0) {
                expect(paginatedCourses[0].id).toBe(allCourses[offset].id);
              }

              // Verify correct number of items returned
              const expectedCount = Math.max(0, Math.min(5, numCourses - offset));
              expect(paginatedCourses.length).toBe(expectedCount);
            }

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 30 }
      );
    }, 20000);

    it('should correctly skip offset items for findPublished', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 8, max: 12 }), // Number of published courses to create
          async (uuid, userData, numPublishedCourses) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create multiple published courses
            for (let i = 0; i < numPublishedCourses; i++) {
              const course = await courseRepository.create({
                creator_id: user.id,
                title: `Published Course ${i + 1}`,
                description: `Description ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });

              // Publish the course
              await courseRepository.updateStatus(course.id, 'published');
              
              // Small delay to ensure different published_at timestamps
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Fetch all published courses without pagination
            const allPublishedCourses = await courseRepository.findPublished(100, 0);

            // Test various offset values
            for (let offset = 0; offset < numPublishedCourses; offset += 3) {
              const paginatedCourses = await courseRepository.findPublished(5, offset);

              // Verify the first item in paginated result matches the item at offset in full list
              if (offset < allPublishedCourses.length && paginatedCourses.length > 0) {
                expect(paginatedCourses[0].id).toBe(allPublishedCourses[offset].id);
              }

              // Verify correct number of items returned
              const expectedCount = Math.max(0, Math.min(5, numPublishedCourses - offset));
              expect(paginatedCourses.length).toBe(expectedCount);
            }

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 30 }
      );
    }, 20000);

    it('should return all records when fetching all pages for findByCreator', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 6, max: 10 }), // Number of courses to create
          fc.integer({ min: 2, max: 4 }), // Page size
          async (uuid, userData, numCourses, pageSize) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create multiple courses
            const createdCourseIds = new Set<string>();
            for (let i = 0; i < numCourses; i++) {
              const course = await courseRepository.create({
                creator_id: user.id,
                title: `Course ${i + 1}`,
                description: `Description ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });
              createdCourseIds.add(course.id);
              // Small delay to ensure different created_at timestamps
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Fetch all courses by paginating through all pages
            const allPaginatedCourses: any[] = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
              const page = await courseRepository.findByCreator(user.id, pageSize, offset);
              allPaginatedCourses.push(...page);
              
              if (page.length < pageSize) {
                hasMore = false;
              } else {
                offset += pageSize;
              }
            }

            // Verify we got all courses exactly once
            expect(allPaginatedCourses.length).toBe(numCourses);

            // Verify each course appears exactly once
            const fetchedCourseIds = new Set(allPaginatedCourses.map(c => c.id));
            expect(fetchedCourseIds.size).toBe(numCourses);

            // Verify all created courses were fetched
            for (const courseId of createdCourseIds) {
              expect(fetchedCourseIds.has(courseId)).toBe(true);
            }

            // Verify ordering is maintained (created_at desc)
            for (let i = 1; i < allPaginatedCourses.length; i++) {
              expect(allPaginatedCourses[i].created_at.getTime()).toBeLessThanOrEqual(
                allPaginatedCourses[i - 1].created_at.getTime()
              );
            }

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 30 }
      );
    }, 20000);

    it('should return all records when fetching all pages for findPublished', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 6, max: 10 }), // Number of published courses to create
          fc.integer({ min: 2, max: 4 }), // Page size
          async (uuid, userData, numPublishedCourses, pageSize) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create multiple published courses
            const createdCourseIds = new Set<string>();
            for (let i = 0; i < numPublishedCourses; i++) {
              const course = await courseRepository.create({
                creator_id: user.id,
                title: `Published Course ${i + 1}`,
                description: `Description ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });

              // Publish the course
              await courseRepository.updateStatus(course.id, 'published');
              createdCourseIds.add(course.id);
              
              // Small delay to ensure different published_at timestamps
              await new Promise(resolve => setTimeout(resolve, 2));
            }

            // Fetch all published courses by paginating through all pages
            const allPaginatedCourses: any[] = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
              const page = await courseRepository.findPublished(pageSize, offset);
              allPaginatedCourses.push(...page);
              
              if (page.length < pageSize) {
                hasMore = false;
              } else {
                offset += pageSize;
              }
            }

            // Verify we got at least our courses (there might be others from previous tests)
            expect(allPaginatedCourses.length).toBeGreaterThanOrEqual(numPublishedCourses);

            // Verify each of our courses appears in the results
            const fetchedCourseIds = new Set(allPaginatedCourses.map(c => c.id));
            for (const courseId of createdCourseIds) {
              expect(fetchedCourseIds.has(courseId)).toBe(true);
            }

            // Verify ordering is maintained (published_at desc)
            for (let i = 1; i < allPaginatedCourses.length; i++) {
              const current = allPaginatedCourses[i].published_at;
              const previous = allPaginatedCourses[i - 1].published_at;
              
              expect(current).toBeDefined();
              expect(previous).toBeDefined();
              expect(current!.getTime()).toBeLessThanOrEqual(previous!.getTime());
            }

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 30 }
      );
    }, 20000);

    it('should handle edge cases with offset beyond total records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 3, max: 6 }), // Number of courses to create
          async (uuid, userData, numCourses) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create courses
            for (let i = 0; i < numCourses; i++) {
              await courseRepository.create({
                creator_id: user.id,
                title: `Course ${i + 1}`,
                description: `Description ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });
            }

            // Test offset beyond total records
            const beyondOffset = numCourses + 5;
            const resultBeyond = await courseRepository.findByCreator(user.id, 10, beyondOffset);
            expect(resultBeyond).toEqual([]);
            expect(resultBeyond.length).toBe(0);

            // Test offset exactly at total records
            const exactOffset = numCourses;
            const resultExact = await courseRepository.findByCreator(user.id, 10, exactOffset);
            expect(resultExact).toEqual([]);
            expect(resultExact.length).toBe(0);

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 30 }
      );
    }, 15000);

    it('should handle zero limit gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            password_hash: fc.string({ minLength: 60, maxLength: 60 }),
            first_name: fc.string({ minLength: 1, maxLength: 100 }),
            last_name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.constant('creator' as const),
          }),
          fc.integer({ min: 3, max: 6 }), // Number of courses to create
          async (uuid, userData, numCourses) => {
            // Create a user (creator) with unique email
            const user = await userRepository.create({
              ...userData,
              email: `${uuid}@test.com`,
            });

            // Create courses
            for (let i = 0; i < numCourses; i++) {
              await courseRepository.create({
                creator_id: user.id,
                title: `Course ${i + 1}`,
                description: `Description ${i + 1}`,
                category: 'programming',
                price: 99.99,
              });
            }

            // Test with limit 0
            const result = await courseRepository.findByCreator(user.id, 0, 0);
            expect(result).toEqual([]);
            expect(result.length).toBe(0);

            // Cleanup
            await prisma.course.deleteMany({ where: { creator_id: user.id } });
            await prisma.user.deleteMany({ where: { id: user.id } });
          }
        ),
        { numRuns: 30 }
      );
    }, 15000);
  });
});
