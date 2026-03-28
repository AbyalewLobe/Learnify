import { prisma } from '../config/prisma';
import { Video, Prisma, VideoStatus } from '@prisma/client';

export class VideoRepository {
  async create(data: Prisma.VideoCreateInput): Promise<Video> {
    return prisma.video.create({
      data,
    });
  }

  async findById(id: string): Promise<Video | null> {
    return prisma.video.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.VideoUpdateInput): Promise<Video> {
    return prisma.video.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: VideoStatus, errorMessage?: string): Promise<Video> {
    return prisma.video.update({
      where: { id },
      data: {
        status,
        ...(errorMessage && { error_message: errorMessage }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.video.delete({
      where: { id },
    });
  }

  async findByUploaderId(uploaderId: string): Promise<Video[]> {
    return prisma.video.findMany({
      where: { uploader_id: uploaderId },
      orderBy: { created_at: 'desc' },
    });
  }
}
