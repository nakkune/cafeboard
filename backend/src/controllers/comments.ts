import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const commentController = {
  // 댓글 목록 조회 (계층형)
  async getComments(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      
      const comments = await prisma.comment.findMany({
        where: { 
          postId: parseInt(postId),
          parentId: null // 최상위 댓글만 조회
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  nickname: true,
                  profileImage: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  // 댓글 작성
  async createComment(req: AuthRequest, res: Response) {
    try {
      const { postId, content, parentId } = req.body;
      const authorId = req.userId;

      if (!authorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // 게시글 존재 확인
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // 대댓글인 경우 부모 댓글 확인
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parseInt(parentId) }
        });
        
        if (!parentComment) {
          return res.status(404).json({ error: 'Parent comment not found' });
        }

        // 최대 3 depth 제한
        if (parentComment.parentId) {
          return res.status(400).json({ error: 'Maximum reply depth exceeded' });
        }
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          postId: parseInt(postId),
          authorId,
          parentId: parentId ? parseInt(parentId) : null,
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          }
        }
      });

      // 게시글 댓글 수 증가
      await prisma.post.update({
        where: { id: parseInt(postId) },
        data: { commentCount: { increment: 1 } }
      });

      res.status(201).json({ comment });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  },

  // 댓글 수정
  async updateComment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(id) }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updatedComment = await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { content },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          }
        }
      });

      res.json({ comment: updatedComment });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  },

  // 댓글 삭제 (soft delete)
  async deleteComment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(id) }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // soft delete - 내용만 변경하고 삭제 표시
      await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { 
          isDeleted: true,
          content: '삭제된 댓글입니다.'
        }
      });

      // 게시글 댓글 수 감소
      await prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } }
      });

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  },

  // 댓글 추천
  async likeComment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(id) }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // 이미 추천했는지 확인
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'comment',
            targetId: parseInt(id)
          }
        }
      });

      if (existingLike) {
        // 추천 취소
        await prisma.like.delete({
          where: { id: existingLike.id }
        });
        
        await prisma.comment.update({
          where: { id: parseInt(id) },
          data: { likeCount: { decrement: 1 } }
        });

        return res.json({ message: 'Like removed', liked: false });
      }

      // 추천 추가
      await prisma.like.create({
        data: {
          userId,
          targetType: 'comment',
          targetId: parseInt(id)
        }
      });

      await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { likeCount: { increment: 1 } }
      });

      res.json({ message: 'Comment liked', liked: true });
    } catch (error) {
      console.error('Like comment error:', error);
      res.status(500).json({ error: 'Failed to like comment' });
    }
  }
};
