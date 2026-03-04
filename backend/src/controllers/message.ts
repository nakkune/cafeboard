import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';
import { getIO } from '../utils/websocket';

export const messageController = {
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const { channelId } = req.params;
      const { cursor, limit = 50 } = req.query;
      const userId = req.userId as number;

      const channel = await prisma.channel.findFirst({
        where: { id: parseInt(channelId) }
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
          return res.status(403).json({ error: 'Not a member of this channel' });
        }
      } else {
        const workspaceMember = await prisma.workspaceMember.findFirst({
          where: {
            workspaceId: channel.workspaceId,
            userId
          }
        });

        if (!workspaceMember) {
          return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        const existingChannelMember = await prisma.channelMember.findFirst({
          where: {
            channelId: parseInt(channelId),
            userId
          }
        });

        if (!existingChannelMember) {
          await prisma.channelMember.create({
            data: {
              channelId: parseInt(channelId),
              userId,
              role: 'member'
            }
          });
        }
      }

      const whereClause: any = {
        channelId: parseInt(channelId),
        isDeleted: false,
        parentId: null
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
              profileImage: true,
              presence: {
                select: {
                  status: true,
                  lastActiveAt: true
                }
              }
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
          attachments: true,
          _count: {
            select: {
              replies: true
            }
          },
          reads: {
            where: {
              userId: req.userId
            },
            select: {
              readAt: true
            }
          }
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
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  },

  async getThreadMessages(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const { limit = 50 } = req.query;
      const userId = req.userId as number;

      const parentMessage = await prisma.message.findFirst({
        where: {
          id: parseInt(messageId),
          isDeleted: false
        }
      });

      if (!parentMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const channelId = parentMessage!.channelId!;

      const channel = await prisma.channel.findFirst({
        where: { id: channelId }
      });

      if (channel?.type === 'private') {
        const channelMember = await prisma.channelMember.findFirst({
          where: {
            channelId: channelId,
            userId
          }
        });

        if (!channelMember) {
          return res.status(403).json({ error: 'Not a member of this channel' });
        }
      }

      const messages = await prisma.message.findMany({
        where: {
          parentId: parseInt(messageId),
          isDeleted: false
        },
        take: parseInt(limit as string),
        orderBy: { createdAt: 'asc' },
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

      res.json(messages);
    } catch (error) {
      console.error('Get thread messages error:', error);
      res.status(500).json({ error: 'Failed to fetch thread messages' });
    }
  },

  async createMessage(req: AuthRequest, res: Response) {
    try {
      const { channelId } = req.params;
      const { content, type = 'text', parentId, attachments } = req.body;
      const userId = req.userId as number;

      const channel = await prisma.channel.findFirst({
        where: { id: parseInt(channelId) }
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
          return res.status(403).json({ error: 'Not a member of this channel' });
        }
      }

      if (parentId) {
        const parentMessage = await prisma.message.findFirst({
          where: { id: parentId, isDeleted: false }
        });

        if (!parentMessage) {
          return res.status(404).json({ error: 'Parent message not found' });
        }
      }

      const message = await prisma.message.create({
        data: {
          channelId: parseInt(channelId),
          authorId: userId,
          content,
          type: type as any,
          parentId: parentId || null,
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

      if (parentId) {
        await prisma.channelMember.updateMany({
          where: {
            channelId: parseInt(channelId),
            userId
          },
          data: { lastReadAt: new Date() }
        });

        // 스레드 부모 작성자에게 알림 발송 (자신이 아닐 경우)
        const parentMessage = await prisma.message.findUnique({
          where: { id: parentId },
          select: { authorId: true, content: true }
        });

        if (parentMessage && parentMessage.authorId !== userId) {
          const { createNotification } = require('./notification');
          await createNotification(
            parentMessage.authorId,
            'thread_reply',
            '새로운 답글',
            `${message.author.nickname}님이 스레드에 답글을 남겼습니다: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            message.id
          );
        }
      }

      // 멘션(@닉네임) 감지 및 알림 발송
      const mentionRegex = /@\[(.+?)\]/g; // 프론트엔드에서 보낼 멘션 포맷 가정: @[닉네임]
      const mentions = content.match(mentionRegex);

      if (mentions) {
        const nicknames = mentions.map((m: string) => m.slice(2, -1));
        const mentionedUsers = await prisma.user.findMany({
          where: {
            nickname: { in: nicknames },
            id: { not: userId } // 자기 자신 멘션 제외
          },
          select: { id: true, nickname: true }
        });

        if (mentionedUsers.length > 0) {
          const { createNotification } = require('./notification');
          for (const targetUser of mentionedUsers) {
            await createNotification(
              targetUser.id,
              'mention',
              '당신이 언급되었습니다',
              `${message.author.nickname}님이 ${channel.name} 채널에서 당신을 언급했습니다.`,
              message.id
            );
          }
        }
      }

      const io = getIO();
      if (io) {
        const sockets = io.sockets.adapter.rooms.get(`channel:${channelId}`);
        console.log(`[WebSocket] Sending message to channel ${channelId}, connected clients: ${sockets ? sockets.size : 0}`);
        io.to(`channel:${channelId}`).emit('message_new', message);
      } else {
        console.log('[WebSocket] IO not initialized');
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  },

  async getMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.userId as number;

      const message = await prisma.message.findFirst({
        where: {
          id: parseInt(messageId),
          isDeleted: false
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
          attachments: true,
          replies: {
            where: { isDeleted: false },
            include: {
              author: {
                select: {
                  id: true,
                  nickname: true,
                  name: true,
                  profileImage: true
                }
              }
            }
          }
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (error) {
      console.error('Get message error:', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  },

  async updateMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.userId as number;

      const message = await prisma.message.findFirst({
        where: {
          id: parseInt(messageId),
          authorId: userId,
          isDeleted: false
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found or no permission' });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: parseInt(messageId) },
        data: {
          content,
          isEdited: true
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

      res.json(updatedMessage);
    } catch (error) {
      console.error('Update message error:', error);
      res.status(500).json({ error: 'Failed to update message' });
    }
  },

  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.userId as number;

      const message = await prisma.message.findFirst({
        where: {
          id: parseInt(messageId),
          isDeleted: false
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const channel = await prisma.channel.findFirst({
        where: { id: message.channelId! }
      });

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: channel?.workspaceId,
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (message.authorId !== userId && !workspaceMember) {
        return res.status(403).json({ error: 'No permission to delete this message' });
      }

      await prisma.message.update({
        where: { id: parseInt(messageId) },
        data: { isDeleted: true, content: '[deleted]' }
      });

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  },

  async addReaction(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.userId as number;

      const message = await prisma.message.findFirst({
        where: {
          id: parseInt(messageId),
          isDeleted: false
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const existingReaction = await prisma.reaction.findFirst({
        where: {
          messageId: parseInt(messageId),
          userId,
          emoji
        }
      });

      if (existingReaction) {
        return res.status(400).json({ error: 'Reaction already exists' });
      }

      const reaction = await prisma.reaction.create({
        data: {
          messageId: parseInt(messageId),
          userId,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              name: true
            }
          }
        }
      });

      // 실시간 반응 알림 전송 (시니어 개발자 관점: UI가 즉시 반응해야 사용자 경험이 향상됨)
      const io = getIO();
      if (io && message.channelId) {
        io.to(`channel:${message.channelId}`).emit('reaction_added', {
          messageId: parseInt(messageId),
          channelId: message.channelId,
          reaction
        });
      }

      res.status(201).json(reaction);
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  },

  async removeReaction(req: AuthRequest, res: Response) {
    try {
      const { messageId, emoji } = req.params;
      const userId = req.userId as number;
      const decodedEmoji = decodeURIComponent(emoji);

      const reaction = await prisma.reaction.findFirst({
        where: {
          messageId: parseInt(messageId),
          userId,
          emoji: decodedEmoji
        },
        include: {
          message: true
        }
      });

      if (!reaction) {
        return res.status(404).json({ error: 'Reaction not found' });
      }

      await prisma.reaction.delete({
        where: { id: reaction.id }
      });

      // 실시간 반응 삭제 알림 전송
      const io = getIO();
      if (io && reaction.message.channelId) {
        io.to(`channel:${reaction.message.channelId}`).emit('reaction_removed', {
          messageId: parseInt(messageId),
          channelId: reaction.message.channelId,
          userId,
          emoji: decodedEmoji
        });
      }

      res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  },

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { channelId } = req.params;
      const { messageId } = req.body;
      const userId = req.userId as number;

      const channel = await prisma.channel.findUnique({
        where: { id: parseInt(channelId) }
      });

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      const channelMember = await prisma.channelMember.findFirst({
        where: {
          channelId: parseInt(channelId),
          userId
        }
      });

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: channel.workspaceId,
          userId
        }
      });

      if (!channelMember && !workspaceMember) {
        return res.status(403).json({ error: 'Not a member of this channel or workspace' });
      }

      const message = await prisma.message.findFirst({
        where: {
          id: parseInt(messageId),
          channelId: parseInt(channelId)
        }
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      await prisma.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId: parseInt(messageId),
            userId
          }
        },
        update: { readAt: new Date() },
        create: {
          messageId: parseInt(messageId),
          userId
        }
      });

      if (channelMember) {
        await prisma.channelMember.update({
          where: { id: channelMember.id },
          data: { lastReadAt: new Date() }
        });
      }

      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  }
};
