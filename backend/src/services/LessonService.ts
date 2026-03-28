import { LessonRepository } from '../repositories/LessonRepository';
import { ChapterRepository } from '../repositories/ChapterRepository';
import { Lesson, LessonType } from '@prisma/client';
import { prisma } from '../config/prisma';

export class LessonService {
  private lessonRepository: LessonRepository;
  private chapterRepository: ChapterRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
    this.chapterRepository = new ChapterRepository();
  }

  async createLesson(
    chapterId: string,
    data: {
      title: string;
      description?: string;
      lesson_type: LessonType;
      content?: any;
      duration_minutes?: number;
      is_preview?: boolean;
    }
  ): Promise<Lesson> {
    // Verify chapter exists
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    // Get next order index
    const orderIndex = await this.lessonRepository.getNextOrderIndex(chapterId);

    // Create lesson
    return this.lessonRepository.create({
      chapter: { connect: { id: chapterId } },
      title: data.title,
      description: data.description,
      lesson_type: data.lesson_type,
      content: data.content || {},
      duration_minutes: data.duration_minutes,
      is_preview: data.is_preview || false,
      order_index: orderIndex,
    });
  }

  async updateLesson(
    id: string,
    data: {
      title?: string;
      description?: string;
      lesson_type?: LessonType;
      content?: any;
      duration_minutes?: number;
      is_preview?: boolean;
    }
  ): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return this.lessonRepository.update(id, data);
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    await this.lessonRepository.delete(id);
  }

  async getLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return lesson;
  }

  async listLessonsByChapter(chapterId: string): Promise<Lesson[]> {
    return this.lessonRepository.findByChapterId(chapterId);
  }

  async reorderLessons(chapterId: string, lessonIds: string[]): Promise<void> {
    // Verify all lessons belong to the chapter
    const lessons = await this.lessonRepository.findByChapterId(chapterId);
    const chapterLessonIds = lessons.map(l => l.id);

    const allBelongToChapter = lessonIds.every(id => chapterLessonIds.includes(id));
    if (!allBelongToChapter) {
      throw new Error('One or more lessons do not belong to this chapter');
    }

    if (lessonIds.length !== lessons.length) {
      throw new Error('All lessons must be included in reorder operation');
    }

    await this.lessonRepository.reorderLessons(chapterId, lessonIds);
  }

  async duplicateLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Get next order index (place after original)
    const orderIndex = lesson.order_index + 1;

    // Shift subsequent lessons
    const subsequentLessons = await prisma.lesson.findMany({
      where: {
        chapter_id: lesson.chapter_id,
        order_index: { gte: orderIndex },
      },
    });

    await prisma.$transaction([
      ...subsequentLessons.map(l =>
        prisma.lesson.update({
          where: { id: l.id },
          data: { order_index: l.order_index + 1 },
        })
      ),
    ]);

    // Create duplicate
    return this.lessonRepository.create({
      chapter: { connect: { id: lesson.chapter_id } },
      title: `${lesson.title} (Copy)`,
      description: lesson.description,
      lesson_type: lesson.lesson_type,
      content: lesson.content as any,
      duration_minutes: lesson.duration_minutes,
      is_preview: lesson.is_preview,
      order_index: orderIndex,
    });
  }

  async moveLesson(id: string, targetChapterId: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Verify target chapter exists
    const targetChapter = await this.chapterRepository.findById(targetChapterId);
    if (!targetChapter) {
      throw new Error('Target chapter not found');
    }

    // Get next order index in target chapter
    const orderIndex = await this.lessonRepository.getNextOrderIndex(targetChapterId);

    return this.lessonRepository.moveLesson(id, targetChapterId, orderIndex);
  }

  async getChapterIdByLessonId(lessonId: string): Promise<string> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return lesson.chapter_id;
  }
}
