import {
  PrismaClient,
  Course as PrismaCourse,
  CourseStatus,
  DifficultyLevel,
} from '@prisma/client';
import { prisma } from '../config/prisma';

export interface Course {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  trailer_video_id?: string;
  category: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  discount_price?: number;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  rejection_reason?: string;
  average_rating: number;
  total_ratings: number;
  total_enrollments: number;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface CreateCourseData {
  creator_id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  trailer_video_id?: string;
  category: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  discount_price?: number;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  trailer_video_id?: string;
  category?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  discount_price?: number;
}

// Type for transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class CourseRepository {
  private prisma: PrismaClient | TransactionClient;

  constructor(prismaClient?: PrismaClient | TransactionClient) {
    // Accept optional Prisma client for transaction support
    this.prisma = prismaClient || prisma;
  }

  async create(data: CreateCourseData): Promise<Course> {
    const result = await this.prisma.course.create({
      data: {
        creator_id: data.creator_id,
        title: data.title,
        description: data.description,
        thumbnail_url: data.thumbnail_url || null,
        trailer_video_id: data.trailer_video_id || null,
        category: data.category,
        difficulty_level: data.difficulty_level as DifficultyLevel | undefined,
        price: data.price,
        discount_price: data.discount_price || null,
        status: 'draft',
      },
    });

    return this.mapPrismaCourseToInterface(result);
  }

  async findById(id: string): Promise<Course | null> {
    const result = await this.prisma.course.findUnique({
      where: { id },
    });

    return result ? this.mapPrismaCourseToInterface(result) : null;
  }

  async findByIdWithDetails(id: string): Promise<any | null> {
    const result = await this.prisma.course.findUnique({
      where: { id },
      include: {
        chapters: {
          include: {
            lessons: {
              orderBy: { order_index: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                lesson_type: true,
                duration_minutes: true,
                order_index: true,
                is_preview: true,
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
        course_tags: {
          select: { tag: true },
        },
      },
    });

    if (!result) {
      return null;
    }

    // Transform the result to match the expected format
    return {
      ...this.mapPrismaCourseToInterface(result),
      chapters: result.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        order_index: chapter.order_index,
        lessons: chapter.lessons,
      })),
      tags: result.course_tags.map(ct => ct.tag),
    };
  }

  async update(id: string, data: UpdateCourseData): Promise<Course | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url;
    if (data.trailer_video_id !== undefined) updateData.trailer_video_id = data.trailer_video_id;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.difficulty_level !== undefined) {
      updateData.difficulty_level = data.difficulty_level as DifficultyLevel;
    }
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discount_price !== undefined) updateData.discount_price = data.discount_price;

    const result = await this.prisma.course.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaCourseToInterface(result);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.course.delete({
        where: {
          id,
          status: 'draft',
        },
      });
      return true;
    } catch (error) {
      // If the record doesn't exist or status is not draft, return false
      return false;
    }
  }

  async findByCreator(
    creatorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Course[]> {
    const results = await this.prisma.course.findMany({
      where: { creator_id: creatorId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return results.map(result => this.mapPrismaCourseToInterface(result));
  }

  async findPublished(limit: number = 20, offset: number = 0): Promise<Course[]> {
    const results = await this.prisma.course.findMany({
      where: { status: 'published' },
      orderBy: { published_at: 'desc' },
      take: limit,
      skip: offset,
    });

    return results.map(result => this.mapPrismaCourseToInterface(result));
  }

  async updateStatus(
    id: string,
    status: 'draft' | 'pending' | 'published' | 'rejected',
    rejectionReason?: string
  ): Promise<Course | null> {
    const updateData: any = {
      status: status as CourseStatus,
      rejection_reason: rejectionReason || null,
    };

    // Set published_at when status changes to 'published'
    if (status === 'published') {
      updateData.published_at = new Date();
    }

    const result = await this.prisma.course.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaCourseToInterface(result);
  }

  async addTags(courseId: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    await this.prisma.courseTag.createMany({
      data: tags.map(tag => ({
        course_id: courseId,
        tag,
      })),
      skipDuplicates: true,
    });
  }

  async removeTags(courseId: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    await this.prisma.courseTag.deleteMany({
      where: {
        course_id: courseId,
        tag: { in: tags },
      },
    });
  }

  async getTags(courseId: string): Promise<string[]> {
    const results = await this.prisma.courseTag.findMany({
      where: { course_id: courseId },
      select: { tag: true },
    });

    return results.map(result => result.tag);
  }

  async hasChaptersAndLessons(courseId: string): Promise<boolean> {
    const result = await this.prisma.chapter.findFirst({
      where: {
        course_id: courseId,
        lessons: {
          some: {},
        },
      },
    });

    return result !== null;
  }

  // Helper method to map Prisma Course to interface
  private mapPrismaCourseToInterface(prismaCourse: PrismaCourse): Course {
    return {
      id: prismaCourse.id,
      creator_id: prismaCourse.creator_id,
      title: prismaCourse.title,
      description: prismaCourse.description,
      thumbnail_url: prismaCourse.thumbnail_url || undefined,
      trailer_video_id: prismaCourse.trailer_video_id || undefined,
      category: prismaCourse.category,
      difficulty_level: prismaCourse.difficulty_level || undefined,
      price: Number(prismaCourse.price),
      discount_price: prismaCourse.discount_price ? Number(prismaCourse.discount_price) : undefined,
      status: prismaCourse.status,
      rejection_reason: prismaCourse.rejection_reason || undefined,
      average_rating: Number(prismaCourse.average_rating),
      total_ratings: prismaCourse.total_ratings,
      total_enrollments: prismaCourse.total_enrollments,
      created_at: prismaCourse.created_at,
      updated_at: prismaCourse.updated_at,
      published_at: prismaCourse.published_at || undefined,
    };
  }
}
