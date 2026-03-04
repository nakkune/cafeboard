import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const searchController = {
  async searchMessages(req: AuthRequest, res: Response) {
    try {
      const { q, channelId, limit = 20 } = req.query;
      const userId = req.userId as number;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const userWorkspaceIds = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true }
      });

      const workspaceIds = userWorkspaceIds.map(w => w.workspaceId);

      const whereClause: any = {
        content: { contains: q, mode: 'insensitive' },
        isDeleted: false,
        channel: {
          workspaceId: { in: workspaceIds }
        }
      };

      if (channelId) {
        whereClause.channelId = parseInt(channelId as string);
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        take: parseInt(limit as string),
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              name: true,
              profileImage: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true,
              workspace: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(messages);
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  },

  async searchChannels(req: AuthRequest, res: Response) {
    try {
      const { q, workspaceId, limit = 20 } = req.query;
      const userId = req.userId as number;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      let workspaceIds: number[];

      if (workspaceId) {
        workspaceIds = [parseInt(workspaceId as string)];
        const member = await prisma.workspaceMember.findFirst({
          where: {
            workspaceId: parseInt(workspaceId as string),
            userId
          }
        });
        if (!member) {
          return res.status(403).json({ error: 'Not a member of this workspace' });
        }
      } else {
        const userWorkspaceIds = await prisma.workspaceMember.findMany({
          where: { userId },
          select: { workspaceId: true }
        });
        workspaceIds = userWorkspaceIds.map(w => w.workspaceId);
      }

      const channels = await prisma.channel.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          name: { contains: q, mode: 'insensitive' },
          isArchived: false
        },
        take: parseInt(limit as string),
        include: {
          workspace: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(channels.map(ch => ({
        ...ch,
        memberCount: ch._count.members,
        messageCount: ch._count.messages
      })));
    } catch (error) {
      console.error('Search channels error:', error);
      res.status(500).json({ error: 'Failed to search channels' });
    }
  },

  async searchUsers(req: AuthRequest, res: Response) {
    try {
      const { q, limit = 20 } = req.query;
      const userId = req.userId as number;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { nickname: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ],
          memberStatus: 'approved',
          isActive: true
        },
        take: parseInt(limit as string),
        select: {
          id: true,
          nickname: true,
          name: true,
          email: true,
          profileImage: true,
          presence: true
        },
        orderBy: { nickname: 'asc' }
      });

      res.json(users);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  },

  async searchTeams(req: AuthRequest, res: Response) {
    try {
      const { q, limit = 20 } = req.query;
      const userId = req.userId as number;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const teams = await prisma.workspace.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          members: {
            some: { userId }
          }
        },
        take: parseInt(limit as string),
        include: {
          _count: {
            select: {
              channels: true,
              members: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(teams.map(t => ({
        ...t,
        memberCount: t._count.members,
        channelCount: t._count.channels
      })));
    } catch (error) {
      console.error('Search teams error:', error);
      res.status(500).json({ error: 'Failed to search teams' });
    }
  }
};
