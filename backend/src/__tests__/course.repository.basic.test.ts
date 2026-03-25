import { CourseRepository } from '../repositories/CourseRepository';
import { prisma } from '../config/prisma';

describe('CourseRepository - Basic Smoke Test', () => {
  let courseRepository: CourseRepository;
  let testUserId: string;

  beforeAll(async () => {
    courseRepository = new CourseRepository();

    // Create a test user for course creation
    const testUser = await prisma.user.create({
      data: {
        email: `test-course-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'creator',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.course.deleteMany({
      where: { creator_id: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  it('should create a course using Prisma Client', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Test Course',
      description: 'Test Description',
      category: 'Programming',
      price: 99.99,
    };

    const course = await courseRepository.create(courseData);

    expect(course).toBeDefined();
    expect(course.id).toBeDefined();
    expect(course.title).toBe('Test Course');
    expect(course.status).toBe('draft');
    expect(course.creator_id).toBe(testUserId);
  });

  it('should find a course by ID', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Find Test Course',
      description: 'Test Description',
      category: 'Programming',
      price: 49.99,
    };

    const created = await courseRepository.create(courseData);
    const found = await courseRepository.findById(created.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
    expect(found?.title).toBe('Find Test Course');
  });

  it('should update a course', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Update Test Course',
      description: 'Original Description',
      category: 'Programming',
      price: 79.99,
    };

    const created = await courseRepository.create(courseData);
    const updated = await courseRepository.update(created.id, {
      title: 'Updated Title',
      description: 'Updated Description',
    });

    expect(updated).toBeDefined();
    expect(updated?.title).toBe('Updated Title');
    expect(updated?.description).toBe('Updated Description');
  });

  it('should delete a draft course', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Delete Test Course',
      description: 'Test Description',
      category: 'Programming',
      price: 29.99,
    };

    const created = await courseRepository.create(courseData);
    const deleted = await courseRepository.delete(created.id);

    expect(deleted).toBe(true);

    const found = await courseRepository.findById(created.id);
    expect(found).toBeNull();
  });

  it('should not delete a non-draft course', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Published Course',
      description: 'Test Description',
      category: 'Programming',
      price: 59.99,
    };

    const created = await courseRepository.create(courseData);
    await courseRepository.updateStatus(created.id, 'published');

    const deleted = await courseRepository.delete(created.id);
    expect(deleted).toBe(false);

    const found = await courseRepository.findById(created.id);
    expect(found).toBeDefined();
  });

  it('should add and get tags', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Tags Test Course',
      description: 'Test Description',
      category: 'Programming',
      price: 39.99,
    };

    const created = await courseRepository.create(courseData);
    await courseRepository.addTags(created.id, ['javascript', 'typescript', 'nodejs']);

    const tags = await courseRepository.getTags(created.id);
    expect(tags).toHaveLength(3);
    expect(tags).toContain('javascript');
    expect(tags).toContain('typescript');
    expect(tags).toContain('nodejs');
  });

  it('should remove tags', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Remove Tags Test Course',
      description: 'Test Description',
      category: 'Programming',
      price: 69.99,
    };

    const created = await courseRepository.create(courseData);
    await courseRepository.addTags(created.id, ['react', 'vue', 'angular']);
    await courseRepository.removeTags(created.id, ['vue']);

    const tags = await courseRepository.getTags(created.id);
    expect(tags).toHaveLength(2);
    expect(tags).toContain('react');
    expect(tags).toContain('angular');
    expect(tags).not.toContain('vue');
  });

  it('should find courses by creator with pagination', async () => {
    // Create multiple courses
    for (let i = 0; i < 3; i++) {
      await courseRepository.create({
        creator_id: testUserId,
        title: `Pagination Test Course ${i}`,
        description: 'Test Description',
        category: 'Programming',
        price: 19.99,
      });
    }

    const courses = await courseRepository.findByCreator(testUserId, 2, 0);
    expect(courses.length).toBeLessThanOrEqual(2);
  });

  it('should check if course has chapters and lessons', async () => {
    const courseData = {
      creator_id: testUserId,
      title: 'Content Check Course',
      description: 'Test Description',
      category: 'Programming',
      price: 89.99,
    };

    const created = await courseRepository.create(courseData);
    const hasContent = await courseRepository.hasChaptersAndLessons(created.id);
    expect(hasContent).toBe(false);
  });
});
