import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const postController = {
  async getPosts(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const skip = (page - 1) * limit;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string | undefined;
      const searchType = req.query.searchType as string | undefined;

      const where: any = { status: 'published' };
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // 검색 조건 추가
      if (search && search.trim()) {
        const searchQuery = search.trim();
        if (searchType === 'content') {
          where.content = { contains: searchQuery, mode: 'insensitive' };
        } else if (searchType === 'title') {
          where.title = { contains: searchQuery, mode: 'insensitive' };
        } else {
          where.OR = [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } }
          ];
        }
      }

      const posts = await prisma.post.findMany({
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

      const total = await prisma.post.count({ where });

      res.json({
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  },

  async getPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`[DEBUG] getPost call with id: ${id}`);
      const postId = parseInt(id);

      if (isNaN(postId)) {
        console.error(`[DEBUG] Invalid postId: ${id}`);
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      // 1. 먼저 게시글 조회 (update 사용 시 없는 ID면 Prisma가 에러 던짐)
      const post = await prisma.post.findUnique({
        where: { id: postId },
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
          },
          images: true,
          files: true,
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // 2. 비동기로 조회수 증가 (응답 속도 최적화)
      prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } }
      }).catch(err => console.error(`Failed to increment viewCount for post ${postId}:`, err));

      res.json({ post });
    } catch (error) {
      console.error('Get post error details:', error);
      res.status(500).json({ error: 'Failed to fetch post', details: error instanceof Error ? error.message : String(error) });
    }
  },

  async createPost(req: AuthRequest, res: Response) {
    try {
      const { title, content, categoryId, images, files } = req.body;
      const authorId = req.userId;

      if (!authorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 게시글 생성 + 이미지/파일 저장
      const post = await prisma.post.create({
        data: {
          title,
          content,
          categoryId: parseInt(categoryId),
          authorId,
          images: images && images.length > 0 ? {
            create: images.map((url: string) => ({
              imageUrl: url,
              fileName: url.split('/').pop()
            }))
          } : undefined,
          files: files && files.length > 0 ? {
            create: files.map((file: any) => ({
              fileUrl: file.url,
              fileName: file.filename || file.url.split('/').pop(),
              originalName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype
            }))
          } : undefined
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
          },
          images: true,
          files: true
        }
      });

      res.status(201).json({ post });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  },

  async updatePost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, files } = req.body;
      const userId = req.userId;

      const existingPost = await prisma.post.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (existingPost.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // 기존 파일 삭제 후 새 파일 추가
      if (files && files.length > 0) {
        await prisma.postFile.deleteMany({
          where: { postId: parseInt(id) }
        });
      }

      const post = await prisma.post.update({
        where: { id: parseInt(id) },
        data: {
          title,
          content,
          files: files && files.length > 0 ? {
            create: files.map((file: any) => ({
              fileUrl: file.url,
              fileName: file.filename || file.url.split('/').pop(),
              originalName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype
            }))
          } : undefined
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
          },
          images: true,
          files: true
        }
      });

      res.json({ post });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  },

  async deletePost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const existingPost = await prisma.post.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (existingPost.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.post.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  },

  async getMyPosts(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const posts = await prisma.post.findMany({
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

      res.json({ posts });
    } catch (error) {
      console.error('Get my posts error:', error);
      res.status(500).json({ error: 'Failed to fetch my posts' });
    }
  },

  // 게시글 좋아요/추천
  async likePost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const post = await prisma.post.findUnique({
        where: { id: parseInt(id) }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // 이미 추천했는지 확인
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'post',
            targetId: parseInt(id)
          }
        }
      });

      if (existingLike) {
        // 추천 취소
        await prisma.like.delete({
          where: { id: existingLike.id }
        });

        await prisma.post.update({
          where: { id: parseInt(id) },
          data: { likeCount: { decrement: 1 } }
        });

        return res.json({ message: 'Like removed', liked: false });
      }

      // 추천 추가
      await prisma.like.create({
        data: {
          userId,
          targetType: 'post',
          targetId: parseInt(id)
        }
      });

      await prisma.post.update({
        where: { id: parseInt(id) },
        data: { likeCount: { increment: 1 } }
      });

      res.json({ message: 'Post liked', liked: true });
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ error: 'Failed to like post' });
    }
  },

  // 게시글 스크랩
  async scrapPost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const post = await prisma.post.findUnique({
        where: { id: parseInt(id) }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // 이미 스크랩했는지 확인
      const existingScrap = await prisma.scrap.findUnique({
        where: {
          userId_postId: {
            userId,
            postId: parseInt(id)
          }
        }
      });

      if (existingScrap) {
        // 스크랩 취소
        await prisma.scrap.delete({
          where: { id: existingScrap.id }
        });

        return res.json({ message: 'Scrap removed', scrapped: false });
      }

      // 스크랩 추가
      await prisma.scrap.create({
        data: {
          userId,
          postId: parseInt(id)
        }
      });

      res.json({ message: 'Post scrapped', scrapped: true });
    } catch (error) {
      console.error('Scrap post error:', error);
      res.status(500).json({ error: 'Failed to scrap post' });
    }
  },

  // 게시글 검색
  async searchPosts(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const searchQuery = q.trim();

      if (searchQuery.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      const posts = await prisma.post.findMany({
        where: {
          status: 'published',
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } }
          ]
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await prisma.post.count({
        where: {
          status: 'published',
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });

      res.json({
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error('Search posts error:', error);
      res.status(500).json({ error: 'Failed to search posts' });
    }
  },
};
