import { prisma } from '../config/prisma';
import { LessonProgress, Prisma } from '@prisma/client';

export class LessonProgressRepository {
  async create(data: Prisma.LessonProgressCreateInput): Promise<LessonProgress> {
    return prisma.lessonProgress.create({
      data,
    });
  }

  async findByStudentAndLesson(
    studentId: string,
    lessonId: string
  ): Promise<LessonProgress | null> {
    return prisma.lessonProgress.findUnique({
      where: {
        student_id_lesson_id: {
          student_id: studentId,
          lesson_id: lessonId,
        },
      },
    });
  }

  async upsert(
    studentId: string,
    lessonId: string,
    data: Partial<Omit<LessonProgress, 'id' | 'student_id' | 'lesson_id'>>
  ): Promise<LessonProgress> {
    return prisma.lessonProgress.upsert({
      where: {
        student_id_lesson_id: {
          student_id: studentId,
          lesson_id: lessonId,
        },
      },
      update: data,
      create: {
        student: { connect: { id: studentId } },
        lesson: { connect: { id: lessonId } },
        ...data,
      },
    });
  }

  async updateVideoPosition(
    studentId: string,
    lessonId: string,
    positionSeconds: number
  ): Promise<LessonProgress> {
    return this.upsert(studentId, lessonId, {
      video_position_seconds: positionSeconds,
      last_accessed_at: new Date(),
    });
  }

  async markComplete(studentId: string, lessonId: string): Promise<LessonProgress> {
    return this.upsert(studentId, lessonId, {
      is_completed: true,
      completed_at: new Date(),
      last_accessed_at: new Date(),
    });
  }

  async findByStudent(studentId: string): Promise<LessonProgress[]> {
    return prisma.lessonProgress.findMany({
      where: { student_id: studentId },
      include: {
        lesson: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCourse(studentId: string, courseId: string): Promise<LessonProgress[]> {
    return prisma.lessonProgress.findMany({
      where: {
        student_id: studentId,
        lesson: {
          chapter: {
            course_id: courseId,
          },
        },
      },
      include: {
        lesson: true,
      },
    });
  }
}
