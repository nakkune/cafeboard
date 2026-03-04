import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';
import { getIO } from '../utils/websocket';

export const notificationController = {
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;
      const { limit = 20, offset = 0 } = req.query;

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });

      res.json({
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;
      const { id } = req.params;

      if (id) {
        await prisma.notification.updateMany({
          where: { id: parseInt(id), userId },
          data: { isRead: true }
        });
      } else {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true }
        });
      }

      res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  },

  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;
      const { id } = req.params;

      await prisma.notification.deleteMany({
        where: { id: parseInt(id), userId }
      });

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  },

  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;

      const count = await prisma.notification.count({
        where: { userId, isRead: false }
      });

      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }
};

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  content: string,
  relatedId?: number
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      relatedId
    }
  });

  // 실시간 알림 전송
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification_new', notification);
  }

  return notification;
}
