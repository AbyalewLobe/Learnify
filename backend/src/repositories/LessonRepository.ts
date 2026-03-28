import { prisma } from '../config/prisma';
import { Lesson, Prisma } from '@prisma/client';

export class LessonRepository {
  async create(data: Prisma.LessonCreateInput): Promise<Lesson> {
    return prisma.lesson.create({
      data,
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: true,
      },
    });
  }

  async findByChapterId(chapterId: string): Promise<Lesson[]> {
    return prisma.lesson.findMany({
      where: { chapter_id: chapterId },
      orderBy: { order_index: 'asc' },
    });
  }

  async update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
    return prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.lesson.delete({
      where: { id },
    });
  }

  async getNextOrderIndex(chapterId: string): Promise<number> {
    const lastLesson = await prisma.lesson.findFirst({
      where: { chapter_id: chapterId },
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });

    return lastLesson ? lastLesson.order_index + 1 : 0;
  }

  async reorderLessons(chapterId: string, lessonIds: string[]): Promise<void> {
    await prisma.$transaction(
      lessonIds.map((lessonId, index) =>
        prisma.lesson.update({
          where: { id: lessonId },
          data: { order_index: index },
        })
      )
    );
  }

  async countByChapterId(chapterId: string): Promise<number> {
    return prisma.lesson.count({
      where: { chapter_id: chapterId },
    });
  }

  async moveLesson(lessonId: string, targetChapterId: string, orderIndex: number): Promise<Lesson> {
    return prisma.lesson.update({
      where: { id: lessonId },
      data: {
        chapter_id: targetChapterId,
        order_index: orderIndex,
      },
    });
  }
}
