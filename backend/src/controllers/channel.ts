import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const channelController = {
  async getChannels(req: AuthRequest, res: Response) {
    try {
      const { workspaceId } = req.params;
      const userId = req.userId as number;

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(workspaceId),
          userId
        }
      });

      if (!workspaceMember) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const channels = await prisma.channel.findMany({
        where: {
          workspaceId: parseInt(workspaceId),
          isArchived: false
        },
        include: {
          _count: {
            select: {
              members: true,
              messages: true
            }
          },
          members: {
            where: { userId }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(channels.map(ch => ({
        ...ch,
        isMember: ch.members.length > 0,
        role: ch.members[0]?.role || null,
        memberCount: ch._count.members,
        messageCount: ch._count.messages
      })));
    } catch (error) {
      console.error('Get channels error:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  },

  async createChannel(req: AuthRequest, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { name, description, type = 'public', topic } = req.body;
      const userId = req.userId as number;

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(workspaceId),
          userId,
          role: { in: ['owner', 'admin', 'member'] }
        }
      });

      if (!workspaceMember) {
        return res.status(403).json({ error: 'No permission to create channel' });
      }

      const existingChannel = await prisma.channel.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: parseInt(workspaceId),
            name
          }
        }
      });

      if (existingChannel) {
        return res.status(400).json({ error: 'Channel name already exists' });
      }

      const channel = await prisma.channel.create({
        data: {
          workspaceId: parseInt(workspaceId),
          name,
          description,
          type: type as any,
          topic,
          members: {
            create: {
              userId,
              role: 'owner'
            }
          }
        },
        include: {
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        }
      });

      res.status(201).json(channel);
    } catch (error) {
      console.error('Create channel error:', error);
      res.status(500).json({ error: 'Failed to create channel' });
    }
  },

  async getChannel(req: AuthRequest, res: Response) {
    try {
      const { workspaceId, channelId } = req.params;
      const userId = req.userId as number;

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(workspaceId),
          userId
        }
      });

      if (!workspaceMember) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const channel = await prisma.channel.findFirst({
        where: {
          id: parseInt(channelId),
          workspaceId: parseInt(workspaceId)
        },
        include: {
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        }
      });

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      if (channel.type === 'private') {
        const channelMember = await prisma.channelMember.findFirst({
          where: {
            channelId: parseInt(channelId),
            userId
          }
        });

        if (!channelMember) {
          return res.status(403).json({ error: 'Not a member of this private channel' });
        }
      }

      res.json(channel);
    } catch (error) {
      console.error('Get channel error:', error);
      res.status(500).json({ error: 'Failed to fetch channel' });
    }
  },

  async updateChannel(req: AuthRequest, res: Response) {
    try {
      const { workspaceId, channelId } = req.params;
      const { name, description, topic } = req.body;
      const userId = req.userId as number;

      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!channelMember) {
        return res.status(403).json({ error: 'No permission to update channel' });
      }

      const channel = await prisma.channel.update({
        where: { id: parseInt(channelId) },
        data: { name, description, topic }
      });

      res.json(channel);
    } catch (error) {
      console.error('Update channel error:', error);
      res.status(500).json({ error: 'Failed to update channel' });
    }
  },

  async deleteChannel(req: AuthRequest, res: Response) {
    try {
      const { workspaceId, channelId } = req.params;
      const userId = req.userId as number;

      const workspace = await prisma.workspace.findUnique({
        where: { id: parseInt(workspaceId) }
      });

      if (workspace?.ownerId === userId) {
        await prisma.channel.delete({
          where: { id: parseInt(channelId) }
        });
        return res.json({ message: 'Channel deleted successfully' });
      }

      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId,
          role: 'owner'
        }
      });

      if (!channelMember) {
        return res.status(403).json({ error: 'Only channel or workspace owner can delete channel' });
      }

      await prisma.channel.delete({
        where: { id: parseInt(channelId) }
      });

      res.json({ message: 'Channel deleted successfully' });
    } catch (error) {
      console.error('Delete channel error:', error);
      res.status(500).json({ error: 'Failed to delete channel' });
    }
  },

  async getMembers(req: AuthRequest, res: Response) {
    try {
      const { workspaceId, channelId } = req.params;
      const userId = req.userId as number;

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(workspaceId),
          userId
        }
      });

      if (!workspaceMember) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const channel = await prisma.channel.findFirst({
        where: {
          id: parseInt(channelId),
          workspaceId: parseInt(workspaceId)
        }
      });

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      if (channel.type === 'private') {
        const channelMember = await prisma.channelMember.findFirst({
          where: {
            channelId: parseInt(channelId),
            userId
          }
        });

        if (!channelMember) {
          return res.status(403).json({ error: 'Not a member of this private channel' });
        }
      }

      const members = await prisma.channelMember.findMany({
        where: { channelId: parseInt(channelId) },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              name: true,
              profileImage: true,
              presence: true
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      });

      res.json(members.map(m => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
        lastReadAt: m.lastReadAt
      })));
    } catch (error) {
      console.error('Get channel members error:', error);
      res.status(500).json({ error: 'Failed to fetch channel members' });
    }
  },

  async addMember(req: AuthRequest, res: Response) {
    try {
      const { workspaceId, channelId } = req.params;
      const { userId: targetUserId, role = 'member' } = req.body;
      const userId = req.userId as number;

      const workspace = await prisma.workspace.findUnique({
        where: { id: parseInt(workspaceId) }
      });

      const isWorkspaceOwner = workspace?.ownerId === userId;

      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!channelMember && !isWorkspaceOwner) {
        return res.status(403).json({ error: 'No permission to add members' });
      }

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(workspaceId),
          userId: parseInt(targetUserId)
        }
      });

      if (!workspaceMember) {
        return res.status(400).json({ error: 'User is not a workspace member' });
      }

      const existingMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId: parseInt(targetUserId)
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a channel member' });
      }

      const newMember = await prisma.channelMember.create({
        data: {
          channelId: parseInt(channelId),
          userId: parseInt(targetUserId),
          role: role as any
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              name: true,
              profileImage: true
            }
          }
        }
      });

      res.status(201).json({
        ...newMember.user,
        role: newMember.role,
        joinedAt: newMember.joinedAt
      });
    } catch (error) {
      console.error('Add channel member error:', error);
      res.status(500).json({ error: 'Failed to add channel member' });
    }
  },

  async removeMember(req: AuthRequest, res: Response) {
    try {
      const { workspaceId, channelId, userId } = req.params;
      const currentUserId = req.userId as number;

      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId: currentUserId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!channelMember) {
        return res.status(403).json({ error: 'No permission to remove members' });
      }

      const targetMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId: parseInt(userId)
        }
      });

      if (!targetMember) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (targetMember.role === 'owner') {
        return res.status(400).json({ error: 'Cannot remove channel owner' });
      }

      await prisma.channelMember.delete({
        where: { id: targetMember.id }
      });

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove channel member error:', error);
      res.status(500).json({ error: 'Failed to remove channel member' });
    }
  },

  async updateMemberRole(req: AuthRequest, res: Response) {
    try {
      const { channelId, userId } = req.params;
      const { role } = req.body;
      const currentUserId = req.userId as number;

      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId: currentUserId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!channelMember) {
        return res.status(403).json({ error: 'No permission to update member roles' });
      }

      const targetMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId: parseInt(userId)
        }
      });

      if (!targetMember) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (targetMember.role === 'owner' && role !== 'owner') {
        const ownerCount = await prisma.channelMember.count({
          where: {
            channelId: parseInt(channelId),
            role: 'owner'
          }
        });
        if (ownerCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove the only channel owner' });
        }
      }

      const updatedMember = await prisma.channelMember.update({
        where: { id: targetMember.id },
        data: { role: role as any }
      });

      res.json(updatedMember);
    } catch (error) {
      console.error('Update channel member role error:', error);
      res.status(500).json({ error: 'Failed to update channel member role' });
    }
  }
};
