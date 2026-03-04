import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

const getBaseUrl = (req: Request): string => {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${host}`;
};

const isValidUrl = (url: string): boolean => {
  if (url.startsWith('/')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const isValidVideoType = (type: string): type is 'local' | 'external' => {
  return type === 'local' || type === 'external';
};

const isValidVideoStatus = (status: string): status is 'published' | 'hidden' | 'draft' => {
  return status === 'published' || status === 'hidden' || status === 'draft';
};

const sanitizeUrl = (url: string, baseUrl: string): string => {
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  if (isValidUrl(url)) {
    return url;
  }
  return '';
};

const transformVideoUrl = (video: any, baseUrl: string): any => {
  if (video.videoType === 'local' && video.videoUrl && !video.videoUrl.startsWith('http')) {
    return { ...video, videoUrl: `${baseUrl}${video.videoUrl}` };
  }
  return video;
};

export const videoController = {
  async getVideos(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 100);
      const skip = (page - 1) * limit;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const videoType = req.query.videoType as string | undefined;

      if (videoType && !isValidVideoType(videoType)) {
        return res.status(400).json({ error: 'Invalid video type' });
      }

      const where: any = { status: 'published' };
      if (categoryId && !isNaN(categoryId)) {
        where.categoryId = categoryId;
      }
      if (videoType) {
        where.videoType = videoType;
      }
      if (search && search.trim()) {
        const searchQuery = search.trim();
        where.OR = [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ];
      }

      const videos = await prisma.video.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await prisma.video.count({ where });

      const baseUrl = getBaseUrl(req);
      const videosWithFullUrl = videos.map(v => transformVideoUrl(v, baseUrl));

      res.json({
        videos: videosWithFullUrl,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error('Get videos error:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  },

  async getVideo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Invalid video ID' });
      }
      const baseUrl = getBaseUrl(req);

      const video = await prisma.video.update({
        where: { id: parsedId },
        data: { viewCount: { increment: 1 } },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.json({ video: transformVideoUrl(video, baseUrl) });
    } catch (error) {
      console.error('Get video error:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  },

  async createVideo(req: AuthRequest, res: Response) {
    try {
      const { title, description, videoType, videoUrl, thumbnailUrl, duration, categoryId, status } = req.body;
      const authorId = req.userId;

      if (!authorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!videoType || !isValidVideoType(videoType)) {
        return res.status(400).json({ error: 'Invalid video type' });
      }

      if (!videoUrl || typeof videoUrl !== 'string') {
        return res.status(400).json({ error: 'Video URL is required' });
      }

      if (videoType === 'external' && !isValidUrl(videoUrl)) {
        return res.status(400).json({ error: 'Invalid video URL' });
      }

      if (thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.trim() !== '') {
        if (!isValidUrl(thumbnailUrl)) {
          return res.status(400).json({ error: 'Invalid thumbnail URL' });
        }
      }

      const validStatus = status && isValidVideoStatus(status) ? status : 'published';

      const video = await prisma.video.create({
        data: {
          title: title.trim().substring(0, 255),
          description: description?.trim().substring(0, 2000) || null,
          videoType,
          videoUrl: videoUrl.trim(),
          thumbnailUrl: thumbnailUrl?.trim() || null,
          duration: duration ? parseInt(duration, 10) : null,
          categoryId: categoryId ? parseInt(categoryId, 10) : null,
          authorId,
          status: validStatus,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      res.status(201).json({ video });
    } catch (error) {
      console.error('Create video error:', error);
      res.status(500).json({ error: 'Failed to create video' });
    }
  },

  async updateVideo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, videoType, videoUrl, thumbnailUrl, duration, categoryId, status } = req.body;
      const userId = req.userId;

      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Invalid video ID' });
      }

      const existingVideo = await prisma.video.findUnique({
        where: { id: parsedId }
      });

      if (!existingVideo) {
        return res.status(404).json({ error: 'Video not found' });
      }

      if (existingVideo.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (videoType && !isValidVideoType(videoType)) {
        return res.status(400).json({ error: 'Invalid video type' });
      }

      if (videoUrl && typeof videoUrl !== 'string') {
        return res.status(400).json({ error: 'Invalid video URL' });
      }

      if (videoUrl && videoType === 'external' && !isValidUrl(videoUrl)) {
        return res.status(400).json({ error: 'Invalid video URL' });
      }

      if (thumbnailUrl && typeof thumbnailUrl === 'string' && thumbnailUrl.trim() !== '') {
        if (!isValidUrl(thumbnailUrl)) {
          return res.status(400).json({ error: 'Invalid thumbnail URL' });
        }
      }

      if (status && !isValidVideoStatus(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const video = await prisma.video.update({
        where: { id: parsedId },
        data: {
          title: title?.trim().substring(0, 255),
          description: description?.trim().substring(0, 2000) || null,
          videoType: videoType || existingVideo.videoType,
          videoUrl: videoUrl?.trim() || existingVideo.videoUrl,
          thumbnailUrl: thumbnailUrl?.trim() || null,
          duration: duration ? parseInt(duration, 10) : null,
          categoryId: categoryId ? parseInt(categoryId, 10) : null,
          status: status || existingVideo.status,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      res.json({ video });
    } catch (error) {
      console.error('Update video error:', error);
      res.status(500).json({ error: 'Failed to update video' });
    }
  },

  async deleteVideo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: 'Invalid video ID' });
      }
      const userId = req.userId;

      const existingVideo = await prisma.video.findUnique({
        where: { id: parsedId }
      });

      if (!existingVideo) {
        return res.status(404).json({ error: 'Video not found' });
      }

      if (existingVideo.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.video.delete({
        where: { id: parsedId }
      });

      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  },

  async getMyVideos(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const videos = await prisma.video.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ videos });
    } catch (error) {
      console.error('Get my videos error:', error);
      res.status(500).json({ error: 'Failed to fetch my videos' });
    }
  },
};
