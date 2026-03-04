import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';
import { getIO } from '../utils/websocket';

export const presenceController = {
  async getPresence(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const presence = await prisma.userPresence.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (!presence) {
        return res.json({ status: 'offline', lastActiveAt: null });
      }

      res.json(presence);
    } catch (error) {
      console.error('Get presence error:', error);
      res.status(500).json({ error: 'Failed to get presence' });
    }
  },

  async getTeamPresence(req: AuthRequest, res: Response) {
    try {
      const { teamId } = req.params;
      const userId = req.userId as number;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(teamId),
          userId
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this team' });
      }

      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: parseInt(teamId)
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
              profileImage: true,
              presence: true
            }
          }
        }
      });

      res.json(members.map(m => ({
        id: m.user.id,
        nickname: m.user.nickname,
        name: m.user.name,
        profileImage: m.user.profileImage,
        status: m.user.presence?.status || 'offline',
        lastActiveAt: m.user.presence?.lastActiveAt
      })));
    } catch (error) {
      console.error('Get team presence error:', error);
      res.status(500).json({ error: 'Failed to get team presence' });
    }
  },

  async updatePresence(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;
      const { status } = req.body;

      const validStatuses = ['online', 'away', 'busy', 'offline'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const presence = await prisma.userPresence.upsert({
        where: { userId },
        update: {
          status: status as any,
          lastActiveAt: new Date()
        },
        create: {
          userId,
          status: status as any
        }
      });

      // 실시간 상태 변경 알림 (시니어 개발자 관점: 협업 도구에서 존재 확인은 필수)
      const io = getIO();
      if (io) {
        io.emit('status_changed', { userId, status });
      }

      res.json(presence);
    } catch (error) {
      console.error('Update presence error:', error);
      res.status(500).json({ error: 'Failed to update presence' });
    }
  },

  async setOnline(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;

      const presence = await prisma.userPresence.upsert({
        where: { userId },
        update: {
          status: 'online',
          lastActiveAt: new Date()
        },
        create: {
          userId,
          status: 'online'
        }
      });

      const io = getIO();
      if (io) {
        io.emit('status_changed', { userId, status: 'online' });
      }

      res.json(presence);
    } catch (error) {
      console.error('Set online error:', error);
      res.status(500).json({ error: 'Failed to set online' });
    }
  },

  async setOffline(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;

      const presence = await prisma.userPresence.upsert({
        where: { userId },
        update: {
          status: 'offline',
          lastActiveAt: new Date()
        },
        create: {
          userId,
          status: 'offline'
        }
      });

      const io = getIO();
      if (io) {
        io.emit('status_changed', { userId, status: 'offline' });
      }

      res.json(presence);
    } catch (error) {
      console.error('Set offline error:', error);
      res.status(500).json({ error: 'Failed to set offline' });
    }
  }
};
