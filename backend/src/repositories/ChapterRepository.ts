import { prisma } from '../config/prisma';
import { Chapter, Prisma } from '@prisma/client';

export class ChapterRepository {
  async create(data: Prisma.ChapterCreateInput): Promise<Chapter> {
    return prisma.chapter.create({
      data,
    });
  }

  async findById(id: string): Promise<Chapter | null> {
    return prisma.chapter.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order_index: 'asc' },
        },
      },
    });
  }

  async findByCourseId(courseId: string): Promise<Chapter[]> {
    return prisma.chapter.findMany({
      where: { course_id: courseId },
      orderBy: { order_index: 'asc' },
      include: {
        lessons: {
          orderBy: { order_index: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ChapterUpdateInput): Promise<Chapter> {
    return prisma.chapter.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.chapter.delete({
      where: { id },
    });
  }

  async getNextOrderIndex(courseId: string): Promise<number> {
    const lastChapter = await prisma.chapter.findFirst({
      where: { course_id: courseId },
      orderBy: { order_index: 'desc' },
      select: { order_index: true },
    });

    return lastChapter ? lastChapter.order_index + 1 : 0;
  }

  async reorderChapters(courseId: string, chapterIds: string[]): Promise<void> {
    await prisma.$transaction(
      chapterIds.map((chapterId, index) =>
        prisma.chapter.update({
          where: { id: chapterId },
          data: { order_index: index },
        })
      )
    );
  }

  async countByCourseId(courseId: string): Promise<number> {
    return prisma.chapter.count({
      where: { course_id: courseId },
    });
  }
}
