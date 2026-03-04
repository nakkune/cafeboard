import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { comparePassword, hashPassword } from '../utils/auth';
import type { AuthRequest } from '../middleware/auth';

export const userController = {
  // 내 정보 조회
  async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          bio: true,
          role: true,
          createdAt: true,
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Failed to fetch user info' });
    }
  },

  // 내 정보 수정
  async updateMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { nickname, bio } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 닉네임 중복 확인
      if (nickname) {
        const existingUser = await prisma.user.findFirst({
          where: {
            nickname,
            id: { not: userId }
          }
        });

        if (existingUser) {
          return res.status(400).json({ error: 'Nickname already taken' });
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(nickname && { nickname }),
          ...(bio !== undefined && { bio }),
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          bio: true,
          role: true,
          createdAt: true,
        }
      });

      res.json({ user });
    } catch (error) {
      console.error('Update me error:', error);
      res.status(500).json({ error: 'Failed to update user info' });
    }
  },

  // 비밀번호 변경
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // 현재 비밀번호 확인
      const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // 새 비밀번호 해싱
      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  // 프로필 이미지 업데이트 (URL 기반)
  async updateProfileImage(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { profileImage } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { profileImage },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileImage: true,
          bio: true,
          role: true,
          createdAt: true,
        }
      });

      res.json({ user });
    } catch (error) {
      console.error('Update profile image error:', error);
      res.status(500).json({ error: 'Failed to update profile image' });
    }
  },

  // 내 스크랩 목록 조회
  async getMyScraps(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const scraps = await prisma.scrap.findMany({
        where: { userId },
        include: {
          post: {
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
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ scraps });
    } catch (error) {
      console.error('Get my scraps error:', error);
      res.status(500).json({ error: 'Failed to fetch scraps' });
    }
  },

  // 특정 사용자의 게시글 조회
  async getUserPosts(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const posts = await prisma.post.findMany({
        where: { 
          authorId: parseInt(id),
          status: 'published'
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
        orderBy: { createdAt: 'desc' }
      });

      res.json({ posts });
    } catch (error) {
      console.error('Get user posts error:', error);
      res.status(500).json({ error: 'Failed to fetch user posts' });
    }
  }
};
