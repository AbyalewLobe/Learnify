import { PrismaClient } from '@prisma/client';
import {
  CourseRepository,
  CreateCourseData,
  UpdateCourseData,
} from '../repositories/CourseRepository';
import { UserRepository, CreateUserDTO } from '../repositories/UserRepository';

/**
 * Unit Tests for CourseRepository
 * Tests specific examples and edge cases for CourseRepository methods
 *
 * **Validates: Requirements 4.15, 12.1, 12.2, 12.3, 12.4, 12.5**
 */

describe('Unit Tests: CourseRepository', () => {
  let prisma: PrismaClient;
  let courseRepository: CourseRepository;
  let userRepository: UserRepository;
  let testCreatorId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    courseRepository = new CourseRepository(prisma);
    userRepository = new UserRepository(prisma);

    // Create a test creator user for course creation
    const creatorData: CreateUserDTO = {
      email: 'creator@test.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'Creator',
      role: 'creator',
    };
    const creator = await userRepository.create(creatorData);
    testCreatorId = creator.id;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.courseTag.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('create()', () => {
    it('should create a new course with valid data', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Test Course',
        description: 'This is a test course description',
        category: 'Programming',
        difficulty_level: 'beginner',
        price: 49.99,
      };

      const course = await courseRepository.create(courseData);

      expect(course).toBeDefined();
      expect(course.id).toBeDefined();
      expect(course.creator_id).toBe(testCreatorId);
      expect(course.title).toBe(courseData.title);
      expect(course.description).toBe(courseData.description);
      expect(course.category).toBe(courseData.category);
      expect(course.difficulty_level).toBe(courseData.difficulty_level);
      expect(course.price).toBe(courseData.price);
      expect(course.status).toBe('draft');
      expect(course.average_rating).toBe(0);
      expect(course.total_ratings).toBe(0);
      expect(course.total_enrollments).toBe(0);
      expect(course.created_at).toBeInstanceOf(Date);
      expect(course.updated_at).toBeInstanceOf(Date);
    });

    it('should create a course with optional fields', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Advanced Course',
        description: 'Advanced course with all fields',
        category: 'Design',
        difficulty_level: 'advanced',
        price: 99.99,
        discount_price: 79.99,
        thumbnail_url: 'https://example.com/thumbnail.jpg',
        trailer_video_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const course = await courseRepository.create(courseData);

      expect(course.discount_price).toBe(courseData.discount_price);
      expect(course.thumbnail_url).toBe(courseData.thumbnail_url);
      expect(course.trailer_video_id).toBe(courseData.trailer_video_id);
    });

    it('should create courses with different difficulty levels', async () => {
      const beginnerCourse = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Beginner Course',
        description: 'For beginners',
        category: 'Programming',
        difficulty_level: 'beginner',
        price: 29.99,
      });

      const intermediateCourse = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Intermediate Course',
        description: 'For intermediate learners',
        category: 'Programming',
        difficulty_level: 'intermediate',
        price: 49.99,
      });

      const advancedCourse = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Advanced Course',
        description: 'For advanced learners',
        category: 'Programming',
        difficulty_level: 'advanced',
        price: 79.99,
      });

      expect(beginnerCourse.difficulty_level).toBe('beginner');
      expect(intermediateCourse.difficulty_level).toBe('intermediate');
      expect(advancedCourse.difficulty_level).toBe('advanced');
    });
  });

  describe('findById()', () => {
    it('should find an existing course by ID', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Find By ID Course',
        description: 'Test finding by ID',
        category: 'Programming',
        price: 39.99,
      };

      const created = await courseRepository.create(courseData);
      const found = await courseRepository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe(courseData.title);
      expect(found?.description).toBe(courseData.description);
    });

    it('should return null for non-existent course ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const found = await courseRepository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  describe('findByIdWithDetails()', () => {
    it('should find course with chapters and lessons', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Course With Details',
        description: 'Test finding with details',
        category: 'Programming',
        price: 49.99,
      };

      const course = await courseRepository.create(courseData);

      // Create a chapter
      const chapter = await prisma.chapter.create({
        data: {
          course_id: course.id,
          title: 'Chapter 1',
          description: 'First chapter',
          order_index: 1,
        },
      });

      // Create lessons
      await prisma.lesson.create({
        data: {
          chapter_id: chapter.id,
          title: 'Lesson 1',
          description: 'First lesson',
          lesson_type: 'video',
          order_index: 1,
          duration_minutes: 30,
        },
      });

      await prisma.lesson.create({
        data: {
          chapter_id: chapter.id,
          title: 'Lesson 2',
          description: 'Second lesson',
          lesson_type: 'quiz',
          order_index: 2,
        },
      });

      const found = await courseRepository.findByIdWithDetails(course.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(course.id);
      expect(found?.chapters).toHaveLength(1);
      expect(found?.chapters[0].title).toBe('Chapter 1');
      expect(found?.chapters[0].lessons).toHaveLength(2);
      expect(found?.chapters[0].lessons[0].title).toBe('Lesson 1');
      expect(found?.chapters[0].lessons[1].title).toBe('Lesson 2');
    });

    it('should find course with tags', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Course With Tags',
        description: 'Test finding with tags',
        category: 'Programming',
        price: 49.99,
      };

      const course = await courseRepository.create(courseData);
      await courseRepository.addTags(course.id, ['javascript', 'react', 'frontend']);

      const found = await courseRepository.findByIdWithDetails(course.id);

      expect(found).not.toBeNull();
      expect(found?.tags).toHaveLength(3);
      expect(found?.tags).toContain('javascript');
      expect(found?.tags).toContain('react');
      expect(found?.tags).toContain('frontend');
    });

    it('should return null for non-existent course', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const found = await courseRepository.findByIdWithDetails(nonExistentId);

      expect(found).toBeNull();
    });

    it('should return empty arrays for course without chapters or tags', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Empty Course',
        description: 'Course without content',
        category: 'Programming',
        price: 29.99,
      };

      const course = await courseRepository.create(courseData);
      const found = await courseRepository.findByIdWithDetails(course.id);

      expect(found).not.toBeNull();
      expect(found?.chapters).toHaveLength(0);
      expect(found?.tags).toHaveLength(0);
    });
  });

  describe('update()', () => {
    it('should update course fields', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Original Title',
        description: 'Original description',
        category: 'Programming',
        price: 49.99,
      };

      const created = await courseRepository.create(courseData);

      const updates: UpdateCourseData = {
        title: 'Updated Title',
        description: 'Updated description',
        price: 59.99,
      };

      const updated = await courseRepository.update(created.id, updates);

      expect(updated).not.toBeNull();
      expect(updated?.id).toBe(created.id);
      expect(updated?.title).toBe(updates.title);
      expect(updated?.description).toBe(updates.description);
      expect(updated?.price).toBe(updates.price);
      expect(updated?.category).toBe(courseData.category); // Unchanged
    });

    it('should update optional fields', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      };

      const created = await courseRepository.create(courseData);

      const updates: UpdateCourseData = {
        thumbnail_url: 'https://example.com/new-thumbnail.jpg',
        discount_price: 39.99,
        difficulty_level: 'intermediate',
      };

      const updated = await courseRepository.update(created.id, updates);

      expect(updated?.thumbnail_url).toBe(updates.thumbnail_url);
      expect(updated?.discount_price).toBe(updates.discount_price);
      expect(updated?.difficulty_level).toBe(updates.difficulty_level);
    });

    it('should throw error when updating non-existent course', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updates: UpdateCourseData = {
        title: 'Updated Title',
      };

      await expect(courseRepository.update(nonExistentId, updates)).rejects.toThrow();
    });

    it('should return course unchanged when no updates provided', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      };

      const created = await courseRepository.create(courseData);
      const updated = await courseRepository.update(created.id, {});

      expect(updated?.id).toBe(created.id);
      expect(updated?.title).toBe(created.title);
      expect(updated?.updated_at).toEqual(created.updated_at);
    });
  });

  describe('delete()', () => {
    it('should delete a draft course', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Draft Course',
        description: 'To be deleted',
        category: 'Programming',
        price: 49.99,
      };

      const course = await courseRepository.create(courseData);
      expect(course.status).toBe('draft');

      const deleted = await courseRepository.delete(course.id);
      expect(deleted).toBe(true);

      const found = await courseRepository.findById(course.id);
      expect(found).toBeNull();
    });

    it('should not delete a published course', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Published Course',
        description: 'Cannot be deleted',
        category: 'Programming',
        price: 49.99,
      };

      const course = await courseRepository.create(courseData);
      await courseRepository.updateStatus(course.id, 'published');

      const deleted = await courseRepository.delete(course.id);
      expect(deleted).toBe(false);

      const found = await courseRepository.findById(course.id);
      expect(found).not.toBeNull();
    });

    it('should return false for non-existent course', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const deleted = await courseRepository.delete(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('findByCreator()', () => {
    it('should find all courses by creator', async () => {
      await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course 1',
        description: 'First course',
        category: 'Programming',
        price: 29.99,
      });

      await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course 2',
        description: 'Second course',
        category: 'Design',
        price: 39.99,
      });

      const courses = await courseRepository.findByCreator(testCreatorId);

      expect(courses).toHaveLength(2);
      expect(courses[0].creator_id).toBe(testCreatorId);
      expect(courses[1].creator_id).toBe(testCreatorId);
    });

    it('should support pagination with limit and offset', async () => {
      // Create 5 courses
      for (let i = 1; i <= 5; i++) {
        await courseRepository.create({
          creator_id: testCreatorId,
          title: `Course ${i}`,
          description: `Course number ${i}`,
          category: 'Programming',
          price: 29.99,
        });
      }

      const firstPage = await courseRepository.findByCreator(testCreatorId, 2, 0);
      expect(firstPage).toHaveLength(2);

      const secondPage = await courseRepository.findByCreator(testCreatorId, 2, 2);
      expect(secondPage).toHaveLength(2);

      const thirdPage = await courseRepository.findByCreator(testCreatorId, 2, 4);
      expect(thirdPage).toHaveLength(1);
    });

    it('should return empty array for creator with no courses', async () => {
      const anotherCreator = await userRepository.create({
        email: 'another@test.com',
        password_hash: 'hashed',
        first_name: 'Another',
        last_name: 'Creator',
        role: 'creator',
      });

      const courses = await courseRepository.findByCreator(anotherCreator.id);
      expect(courses).toHaveLength(0);
    });

    it('should order courses by created_at descending', async () => {
      const course1 = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'First Course',
        description: 'Created first',
        category: 'Programming',
        price: 29.99,
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const course2 = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Second Course',
        description: 'Created second',
        category: 'Programming',
        price: 39.99,
      });

      const courses = await courseRepository.findByCreator(testCreatorId);

      expect(courses[0].id).toBe(course2.id); // Most recent first
      expect(courses[1].id).toBe(course1.id);
    });
  });

  describe('findPublished()', () => {
    it('should find only published courses', async () => {
      const draft = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Draft Course',
        description: 'Draft',
        category: 'Programming',
        price: 29.99,
      });

      const published1 = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Published Course 1',
        description: 'Published',
        category: 'Programming',
        price: 39.99,
      });
      await courseRepository.updateStatus(published1.id, 'published');

      const published2 = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Published Course 2',
        description: 'Published',
        category: 'Design',
        price: 49.99,
      });
      await courseRepository.updateStatus(published2.id, 'published');

      const courses = await courseRepository.findPublished();

      expect(courses).toHaveLength(2);
      expect(courses.every(c => c.status === 'published')).toBe(true);
    });

    it('should support pagination', async () => {
      // Create and publish 5 courses
      for (let i = 1; i <= 5; i++) {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: `Published Course ${i}`,
          description: `Course ${i}`,
          category: 'Programming',
          price: 29.99,
        });
        await courseRepository.updateStatus(course.id, 'published');
      }

      const firstPage = await courseRepository.findPublished(2, 0);
      expect(firstPage).toHaveLength(2);

      const secondPage = await courseRepository.findPublished(2, 2);
      expect(secondPage).toHaveLength(2);

      const thirdPage = await courseRepository.findPublished(2, 4);
      expect(thirdPage).toHaveLength(1);
    });

    it('should return empty array when no published courses exist', async () => {
      await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Draft Course',
        description: 'Not published',
        category: 'Programming',
        price: 29.99,
      });

      const courses = await courseRepository.findPublished();
      expect(courses).toHaveLength(0);
    });

    it('should order courses by published_at descending', async () => {
      const course1 = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'First Published',
        description: 'Published first',
        category: 'Programming',
        price: 29.99,
      });
      await courseRepository.updateStatus(course1.id, 'published');

      await new Promise(resolve => setTimeout(resolve, 10));

      const course2 = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Second Published',
        description: 'Published second',
        category: 'Programming',
        price: 39.99,
      });
      await courseRepository.updateStatus(course2.id, 'published');

      const courses = await courseRepository.findPublished();

      expect(courses[0].id).toBe(course2.id); // Most recently published first
      expect(courses[1].id).toBe(course1.id);
    });
  });

  describe('updateStatus()', () => {
    it('should update course status', async () => {
      const course = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      });

      expect(course.status).toBe('draft');

      const updated = await courseRepository.updateStatus(course.id, 'pending');
      expect(updated?.status).toBe('pending');
    });

    it('should set published_at when status changes to published', async () => {
      const course = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      });

      expect(course.published_at).toBeUndefined();

      const updated = await courseRepository.updateStatus(course.id, 'published');
      expect(updated?.status).toBe('published');
      expect(updated?.published_at).toBeInstanceOf(Date);
    });

    it('should set rejection reason when status is rejected', async () => {
      const course = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      });

      const rejectionReason = 'Content does not meet quality standards';
      const updated = await courseRepository.updateStatus(course.id, 'rejected', rejectionReason);

      expect(updated?.status).toBe('rejected');
      expect(updated?.rejection_reason).toBe(rejectionReason);
    });

    it('should throw error when updating status of non-existent course', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(courseRepository.updateStatus(nonExistentId, 'published')).rejects.toThrow();
    });
  });

  describe('Tag management', () => {
    describe('addTags()', () => {
      it('should add tags to a course', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, ['javascript', 'react', 'frontend']);

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(3);
        expect(tags).toContain('javascript');
        expect(tags).toContain('react');
        expect(tags).toContain('frontend');
      });

      it('should skip duplicate tags', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, ['javascript', 'react']);
        await courseRepository.addTags(course.id, ['react', 'typescript']); // 'react' is duplicate

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(3);
        expect(tags).toContain('javascript');
        expect(tags).toContain('react');
        expect(tags).toContain('typescript');
      });

      it('should handle empty tag array', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, []);

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(0);
      });
    });

    describe('removeTags()', () => {
      it('should remove tags from a course', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, ['javascript', 'react', 'typescript']);
        await courseRepository.removeTags(course.id, ['react']);

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(2);
        expect(tags).toContain('javascript');
        expect(tags).toContain('typescript');
        expect(tags).not.toContain('react');
      });

      it('should handle removing non-existent tags', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, ['javascript']);
        await courseRepository.removeTags(course.id, ['python', 'java']); // Non-existent tags

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(1);
        expect(tags).toContain('javascript');
      });

      it('should handle empty tag array', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, ['javascript', 'react']);
        await courseRepository.removeTags(course.id, []);

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(2);
      });
    });

    describe('getTags()', () => {
      it('should return all tags for a course', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        await courseRepository.addTags(course.id, ['javascript', 'react', 'frontend']);

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(3);
      });

      it('should return empty array for course with no tags', async () => {
        const course = await courseRepository.create({
          creator_id: testCreatorId,
          title: 'Course',
          description: 'Description',
          category: 'Programming',
          price: 49.99,
        });

        const tags = await courseRepository.getTags(course.id);
        expect(tags).toHaveLength(0);
      });
    });
  });

  describe('hasChaptersAndLessons()', () => {
    it('should return true when course has chapters with lessons', async () => {
      const course = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      });

      const chapter = await prisma.chapter.create({
        data: {
          course_id: course.id,
          title: 'Chapter 1',
          order_index: 1,
        },
      });

      await prisma.lesson.create({
        data: {
          chapter_id: chapter.id,
          title: 'Lesson 1',
          lesson_type: 'video',
          order_index: 1,
        },
      });

      const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
      expect(hasContent).toBe(true);
    });

    it('should return false when course has chapters but no lessons', async () => {
      const course = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      });

      await prisma.chapter.create({
        data: {
          course_id: course.id,
          title: 'Chapter 1',
          order_index: 1,
        },
      });

      const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
      expect(hasContent).toBe(false);
    });

    it('should return false when course has no chapters', async () => {
      const course = await courseRepository.create({
        creator_id: testCreatorId,
        title: 'Course',
        description: 'Description',
        category: 'Programming',
        price: 49.99,
      });

      const hasContent = await courseRepository.hasChaptersAndLessons(course.id);
      expect(hasContent).toBe(false);
    });
  });

  describe('Transaction support', () => {
    it('should accept optional PrismaClient for transaction support', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Transaction Course',
        description: 'Created in transaction',
        category: 'Programming',
        price: 49.99,
      };

      await prisma.$transaction(async tx => {
        const txCourseRepository = new CourseRepository(tx);
        const course = await txCourseRepository.create(courseData);

        expect(course).toBeDefined();
        expect(course.title).toBe(courseData.title);
      });

      // Verify course was created
      const courses = await courseRepository.findByCreator(testCreatorId);
      expect(courses.length).toBeGreaterThan(0);
    });

    it('should rollback transaction on error', async () => {
      const courseData: CreateCourseData = {
        creator_id: testCreatorId,
        title: 'Rollback Course',
        description: 'Should be rolled back',
        category: 'Programming',
        price: 49.99,
      };

      try {
        await prisma.$transaction(async tx => {
          const txCourseRepository = new CourseRepository(tx);
          await txCourseRepository.create(courseData);

          // Force an error to trigger rollback
          throw new Error('Intentional error for rollback test');
        });
      } catch (error) {
        // Expected error
      }

      // Verify course was NOT created due to rollback
      const courses = await courseRepository.findByCreator(testCreatorId);
      const rollbackCourse = courses.find(c => c.title === 'Rollback Course');
      expect(rollbackCourse).toBeUndefined();
    });
  });
});
