import { ChapterRepository } from '../repositories/ChapterRepository';
import { CourseRepository } from '../repositories/CourseRepository';
import { Chapter } from '@prisma/client';

export class ChapterService {
  private chapterRepository: ChapterRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.chapterRepository = new ChapterRepository();
    this.courseRepository = new CourseRepository();
  }

  async createChapter(
    courseId: string,
    data: { title: string; description?: string }
  ): Promise<Chapter> {
    // Verify course exists
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Get next order index
    const orderIndex = await this.chapterRepository.getNextOrderIndex(courseId);

    // Create chapter
    return this.chapterRepository.create({
      course: { connect: { id: courseId } },
      title: data.title,
      description: data.description,
      order_index: orderIndex,
    });
  }

  async updateChapter(
    id: string,
    data: { title?: string; description?: string }
  ): Promise<Chapter> {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    return this.chapterRepository.update(id, data);
  }

  async deleteChapter(id: string): Promise<void> {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    await this.chapterRepository.delete(id);
  }

  async getChapter(id: string): Promise<Chapter> {
    const chapter = await this.chapterRepository.findById(id);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    return chapter;
  }

  async listChaptersByCourse(courseId: string): Promise<Chapter[]> {
    return this.chapterRepository.findByCourseId(courseId);
  }

  async reorderChapters(courseId: string, chapterIds: string[]): Promise<void> {
    // Verify all chapters belong to the course
    const chapters = await this.chapterRepository.findByCourseId(courseId);
    const courseChapterIds = chapters.map(c => c.id);

    const allBelongToCourse = chapterIds.every(id => courseChapterIds.includes(id));
    if (!allBelongToCourse) {
      throw new Error('One or more chapters do not belong to this course');
    }

    if (chapterIds.length !== chapters.length) {
      throw new Error('All chapters must be included in reorder operation');
    }

    await this.chapterRepository.reorderChapters(courseId, chapterIds);
  }

  async getCourseIdByChapterId(chapterId: string): Promise<string> {
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    return chapter.course_id;
  }
}
