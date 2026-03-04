import { Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from './auth';
import { prisma } from '../utils/db';

// 관리자 권한 확인 미들웨어
export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 먼저 인증 미들웨어 실행
  authMiddleware(req, res, async () => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 사용자 권한 확인
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.role !== 'admin' && user.role !== 'moderator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

// 관리자만 접근 가능 (moderator 불가)
export const strictAdminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, async () => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      next();
    } catch (error) {
      console.error('Strict admin middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};
