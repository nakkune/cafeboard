import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';
import { getIO } from '../utils/websocket';

export const conversationController = {
  async getConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId }
          }
        },
        include: {
          participants: {
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
          },
          _count: {
            select: {
              messages: true,
              participants: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.json(conversations.map(conv => {
        const otherParticipants = conv.participants.filter(p => p.userId !== userId);
        const lastMessage = conv.messages[0];

        return {
          id: conv.id,
          type: conv.type,
          name: conv.type === 'dm'
            ? otherParticipants[0]?.user.nickname || otherParticipants[0]?.user.name
            : conv.name,
          participants: conv.participants.map(p => ({
            id: p.user.id,
            nickname: p.user.nickname,
            name: p.user.name,
            profileImage: p.user.profileImage,
            presence: p.user.presence,
            role: p.role
          })),
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            authorId: lastMessage.authorId
          } : null,
          messageCount: conv._count.messages,
          participantCount: conv._count.participants
        };
      }));
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  async createConversation(req: AuthRequest, res: Response) {
    try {
      const { type = 'dm', name, participantIds } = req.body;
      const userId = req.userId as number;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ error: 'Participant IDs are required' });
      }

      if (type === 'dm' && participantIds.length !== 1) {
        return res.status(400).json({ error: 'DM can only have one other participant' });
      }

      const allParticipantIds = [userId, ...participantIds];

      if (type === 'dm') {
        // Find existing DM with exactly these 2 participants
        const existingConversations = await prisma.conversation.findMany({
          where: {
            type: 'dm',
          },
          include: {
            participants: true
          }
        });

        const existingConversation = existingConversations.find(conv => {
          const participantIds = conv.participants.map(p => p.userId).sort();
          return participantIds.length === 2 &&
            participantIds.includes(userId) &&
            participantIds.includes(participantIds[0] === userId ? participantIds[1] : participantIds[0]);
        });

        if (existingConversation) {
          // Return with user data
          const conversationWithUsers = await prisma.conversation.findUnique({
            where: { id: existingConversation.id },
            include: {
              participants: {
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
              }
            }
          });
          return res.json(conversationWithUsers);
        }
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: type as any,
          name: type === 'group' ? name : null,
          participants: {
            create: allParticipantIds.map((pid, index) => ({
              userId: pid,
              role: index === 0 ? 'owner' : 'member'
            }))
          }
        },
        include: {
          participants: {
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
          }
        }
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  },

  async getConversation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: parseInt(id) },
        include: {
          participants: {
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
          },
          _count: {
            select: {
              messages: true,
              participants: true
            }
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json({
        ...conversation,
        participants: conversation.participants.map(p => ({
          ...p.user,
          role: p.role,
          lastReadAt: p.lastReadAt
        }))
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  async updateConversation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'No permission to update conversation' });
      }

      const conversation = await prisma.conversation.update({
        where: { id: parseInt(id) },
        data: { name }
      });

      res.json(conversation);
    } catch (error) {
      console.error('Update conversation error:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  },

  async deleteConversation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId,
          role: 'owner'
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'Only owner can delete conversation' });
      }

      await prisma.conversation.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  },

  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { cursor, limit = 50 } = req.query;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }

      const whereClause: any = {
        conversationId: parseInt(id),
        isDeleted: false
      };

      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor as string) };
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        take: parseInt(limit as string) + 1,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              name: true,
              profileImage: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  name: true
                }
              }
            }
          },
          attachments: true
        }
      });

      let nextCursor = null;
      if (messages.length > parseInt(limit as string)) {
        const nextMessage = messages.pop();
        nextCursor = nextMessage?.createdAt.toISOString();
      }

      res.json({
        messages,
        nextCursor
      });
    } catch (error) {
      console.error('Get conversation messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  async createMessage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, type = 'text', attachments } = req.body;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }

      const message = await prisma.message.create({
        data: {
          conversationId: parseInt(id),
          authorId: userId,
          content,
          type: type as any,
          attachments: attachments?.length ? {
            create: attachments.map((att: any) => ({
              uploaderId: userId,
              filename: att.filename,
              originalName: att.originalName,
              mimeType: att.mimeType,
              size: att.size,
              url: att.url
            }))
          } : undefined
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              name: true,
              profileImage: true
            }
          },
          attachments: true,
          reactions: true
        }
      });

      await prisma.conversation.update({
        where: { id: parseInt(id) },
        data: { updatedAt: new Date() }
      });

      const io = getIO();
      if (io) {
        io.to(`conversation:${id}`).emit('conversation_message_new', message);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Create conversation message error:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  },

  async getParticipants(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: parseInt(id) },
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

      res.json(participants.map(p => ({
        ...p.user,
        role: p.role,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt
      })));
    } catch (error) {
      console.error('Get conversation participants error:', error);
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  },

  async addParticipant(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userId: targetUserId, role = 'member' } = req.body;
      const userId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'No permission to add participants' });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: parseInt(id) }
      });

      if (conversation?.type === 'dm') {
        return res.status(400).json({ error: 'Cannot add participants to DM' });
      }

      const existingParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId: parseInt(targetUserId)
        }
      });

      if (existingParticipant) {
        return res.status(400).json({ error: 'User is already a participant' });
      }

      const newParticipant = await prisma.conversationParticipant.create({
        data: {
          conversationId: parseInt(id),
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
        ...newParticipant.user,
        role: newParticipant.role,
        joinedAt: newParticipant.joinedAt
      });
    } catch (error) {
      console.error('Add conversation participant error:', error);
      res.status(500).json({ error: 'Failed to add participant' });
    }
  },

  async removeParticipant(req: AuthRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const currentUserId = req.userId as number;

      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId: currentUserId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!participant) {
        return res.status(403).json({ error: 'No permission to remove participants' });
      }

      const targetParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId: parseInt(userId)
        }
      });

      if (!targetParticipant) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      if (targetParticipant.role === 'owner') {
        return res.status(400).json({ error: 'Cannot remove owner' });
      }

      await prisma.conversationParticipant.delete({
        where: { id: targetParticipant.id }
      });

      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      console.error('Remove conversation participant error:', error);
      res.status(500).json({ error: 'Failed to remove participant' });
    }
  },

  async updateParticipant(req: AuthRequest, res: Response) {
    try {
      const { id, userId: targetUserId } = req.params;
      const { role } = req.body;
      const currentUserId = req.userId as number;

      // Only owner can change roles
      const ownerParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId: currentUserId,
          role: 'owner'
        }
      });

      if (!ownerParticipant) {
        return res.status(403).json({ error: 'Only owner can change roles' });
      }

      // If transferring ownership, the current owner becomes an admin
      if (role === 'owner') {
        await prisma.conversationParticipant.update({
          where: { id: ownerParticipant.id },
          data: { role: 'admin' }
        });
      }

      const targetParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: parseInt(id),
          userId: parseInt(targetUserId)
        }
      });

      if (!targetParticipant) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      const updated = await prisma.conversationParticipant.update({
        where: { id: targetParticipant.id },
        data: { role: role as any }
      });

      res.json(updated);
    } catch (error) {
      console.error('Update participant role error:', error);
      res.status(500).json({ error: 'Failed to update participant role' });
    }
  }
};
