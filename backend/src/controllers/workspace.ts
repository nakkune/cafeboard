import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';
import { getIO } from '../utils/websocket';
import { createNotification } from './notification';

export const workspaceController = {
  async getWorkspaces(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;

      const workspaces = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
          workspace: {
            include: {
              _count: {
                select: {
                  channels: true,
                  members: true
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });

      res.json(workspaces.map(wm => ({
        ...wm.workspace,
        role: wm.role,
        memberCount: wm.workspace._count.members,
        channelCount: wm.workspace._count.channels
      })));
    } catch (error) {
      console.error('Get workspaces error:', error);
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  },

  async createWorkspace(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;
      const { name, description, icon } = req.body;

      const workspace = await prisma.workspace.create({
        data: {
          name,
          description,
          icon,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'owner'
            }
          },
          channels: {
            create: {
              name: '일반',
              description: '가입 시 자동으로 참여되는 기본 채널입니다.',
              type: 'public',
              members: {
                create: {
                  userId,
                  role: 'owner'
                }
              }
            }
          }
        },
        include: {
          _count: {
            select: {
              channels: true,
              members: true
            }
          }
        }
      });

      res.status(201).json(workspace);
    } catch (error) {
      console.error('Create workspace error:', error);
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  },

  async getWorkspace(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: {
              channels: true,
              members: true
            }
          }
        }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      res.json({
        ...workspace,
        role: member.role,
        memberCount: workspace._count.members,
        channelCount: workspace._count.channels
      });
    } catch (error) {
      console.error('Get workspace error:', error);
      res.status(500).json({ error: 'Failed to fetch workspace' });
    }
  },

  async updateWorkspace(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;
      const { name, description, icon } = req.body;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'No permission to update workspace' });
      }

      const workspace = await prisma.workspace.update({
        where: { id: parseInt(id) },
        data: { name, description, icon }
      });

      res.json(workspace);
    } catch (error) {
      console.error('Update workspace error:', error);
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  },

  async deleteWorkspace(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId,
          role: 'owner'
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'Only owner can delete workspace' });
      }

      await prisma.workspace.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
      console.error('Delete workspace error:', error);
      res.status(500).json({ error: 'Failed to delete workspace' });
    }
  },

  async getMembers(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }

      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: parseInt(id) },
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
        joinedAt: m.joinedAt
      })));
    } catch (error) {
      console.error('Get workspace members error:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  },

  async addMember(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { email, role = 'member' } = req.body;
      const userId = req.userId as number;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'No permission to add members' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId: user.id
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      const newMember = await prisma.workspaceMember.create({
        data: {
          workspaceId: parseInt(id),
          userId: user.id,
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
      console.error('Add workspace member error:', error);
      res.status(500).json({ error: 'Failed to add member' });
    }
  },

  async removeMember(req: AuthRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const currentUserId = req.userId as number;

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId: currentUserId,
          role: { in: ['owner', 'admin'] }
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'No permission to remove members' });
      }

      const targetMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId: parseInt(userId)
        }
      });

      if (!targetMember) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (targetMember.role === 'owner') {
        return res.status(400).json({ error: 'Cannot remove owner' });
      }

      // 트랜잭션을 사용하여 워크스페이스 멤버십과 관련 채널 멤버십, 그리고 승인 요청 내역을 모두 삭제
      await prisma.$transaction([
        // 1. 해당 워크스페이스의 모든 채널에서 해당 사용자 제거
        prisma.channelMember.deleteMany({
          where: {
            userId: parseInt(userId),
            channel: {
              workspaceId: parseInt(id)
            }
          }
        }),
        // 2. 해당 워크스페이스에 대한 가입 요청 내역 삭제 (승인 정보 포함)
        prisma.workspaceJoinRequest.deleteMany({
          where: {
            workspaceId: parseInt(id),
            userId: parseInt(userId)
          }
        }),
        // 3. 워크스페이스 멤버십 삭제
        prisma.workspaceMember.delete({
          where: { id: targetMember.id }
        })
      ]);

      // 실시간 알림 전송 (삭제된 사용자에게 알림을 보내 페이지 전환 등을 유도할 수 있음)
      const io = getIO();
      if (io) {
        // 해당 사용자에게 워크스페이스에서 제거되었음을 알림
        io.to(`user:${userId}`).emit('user_removed', {
          workspaceId: parseInt(id)
        });

        // 해당 워크스페이스(팀) 룸에도 멤버 변경 알림
        io.to(`team:${id}`).emit('member_updated', {
          workspaceId: parseInt(id),
          userId: parseInt(userId),
          action: 'remove'
        });
      }

      res.json({ message: 'Member removed successfully and cleared from all channels' });
    } catch (error) {
      console.error('Remove workspace member error:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  },

  async getPublicWorkspaces(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId as number;

      const workspaces = await prisma.workspace.findMany({
        where: {
          isPublic: true,
          NOT: {
            members: {
              some: { userId }
            }
          }
        },
        include: {
          _count: {
            select: {
              channels: true,
              members: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(workspaces.map(w => ({
        ...w,
        memberCount: w._count.members,
        channelCount: w._count.channels
      })));
    } catch (error) {
      console.error('Get public workspaces error:', error);
      res.status(500).json({ error: 'Failed to fetch public workspaces' });
    }
  },

  async joinWorkspace(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: 'Already a member' });
      }

      const existingRequest = await prisma.workspaceJoinRequest.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId
        }
      });

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return res.status(400).json({ error: 'Already requested' });
        }
        if (existingRequest.status === 'approved') {
          return res.status(400).json({ error: 'Already a member' });
        }
      }

      const request = await prisma.workspaceJoinRequest.create({
        data: {
          workspaceId: parseInt(id),
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              email: true
            }
          },
          workspace: {
            select: {
              name: true,
              ownerId: true
            }
          }
        }
      });

      // 실시간 알림 및 DB 알림 생성 (워크스페이스 오너에게)
      const io = getIO();
      if (io && request.workspace.ownerId) {
        // WebSocket 실시간 알림 (기존 커스텀 이벤트)
        io.to(`user:${request.workspace.ownerId}`).emit('join_request_new', {
          workspaceId: request.workspaceId,
          workspaceName: request.workspace.name,
          userNickname: request.user.nickname,
          requestId: request.id
        });

        // DB 알림 생성 (범용 알림 시스템)
        await createNotification(
          request.workspace.ownerId,
          'join_request',
          '새로운 가입 요청',
          `${request.workspace.name} 팀에 ${request.user.nickname}님이 가입 신청을 했습니다.`,
          request.id
        );
      }

      res.json({ message: 'Join request sent successfully' });
    } catch (error) {
      console.error('Join workspace error:', error);
      res.status(500).json({ error: 'Failed to send join request' });
    }
  },

  async getJoinRequests(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId as number;

      const workspace = await prisma.workspace.findUnique({
        where: { id: parseInt(id) }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      if (workspace.ownerId !== userId) {
        return res.status(403).json({ error: 'Only owner can view requests' });
      }

      const requests = await prisma.workspaceJoinRequest.findMany({
        where: {
          workspaceId: parseInt(id),
          status: 'pending'
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
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(requests);
    } catch (error) {
      console.error('Get join requests error:', error);
      res.status(500).json({ error: 'Failed to fetch join requests' });
    }
  },

  async respondToJoinRequest(req: AuthRequest, res: Response) {
    try {
      const { id, requestId } = req.params;
      const { action } = req.body;
      const userId = req.userId as number;

      const workspace = await prisma.workspace.findUnique({
        where: { id: parseInt(id) }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      if (workspace.ownerId !== userId) {
        return res.status(403).json({ error: 'Only owner can respond to requests' });
      }

      const request = await prisma.workspaceJoinRequest.findUnique({
        where: { id: parseInt(requestId) }
      });

      if (!request || request.workspaceId !== parseInt(id)) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (action === 'approve') {
        // 모든 공개 채널 목록을 가져옵니다. (시니어 개발자 관점: 신입 멤버를 모든 공개 채널에 자동 참여시켜 협업 효율성을 높임)
        const publicChannels = await prisma.channel.findMany({
          where: {
            workspaceId: parseInt(id),
            type: 'public',
            isArchived: false
          }
        });

        // 모든 작업을 단일 트랜잭션으로 묶어 데이터 무결성을 보장합니다.
        await prisma.$transaction(async (tx) => {
          // 1. 요청 상태 업데이트
          await tx.workspaceJoinRequest.update({
            where: { id: parseInt(requestId) },
            data: { status: 'approved', processedAt: new Date() }
          });

          // 2. 워크스페이스 멤버십 생성
          await tx.workspaceMember.create({
            data: {
              workspaceId: parseInt(id),
              userId: request.userId,
              role: 'member'
            }
          });

          // 3. 모든 공개 채널에 자동 추가
          for (const channel of publicChannels) {
            await tx.channelMember.create({
              data: {
                channelId: channel.id,
                userId: request.userId,
                role: 'member'
              }
            });
          }
        });

        // 신청자에게 승인 알림 생성 (알림 데이터 기록)
        await createNotification(
          request.userId,
          'join_approved',
          '가입 승인 완료',
          `${workspace.name} 팀 가입 신청이 승인되었습니다.`,
          workspace.id
        );

        const io = getIO();
        if (io) {
          // 팀 전체 성원에게 실시간 멤버 갱신 알림 (이 한 번의 알림으로 모든 팀원의 채널 수/멤버 데이터가 동기화됨)
          io.to(`team:${id}`).emit('member_updated', {
            workspaceId: parseInt(id),
            userId: request.userId,
            action: 'add'
          });

          // 신청자에게 페이지 새로고침을 위한 전용 이벤트 전송
          io.to(`user:${request.userId}`).emit('join_approved', {
            workspaceId: parseInt(id),
            workspaceName: workspace.name
          });
        }
      } else if (action === 'reject') {
        await prisma.workspaceJoinRequest.update({
          where: { id: parseInt(requestId) },
          data: { status: 'rejected', processedAt: new Date() }
        });

        // 신청자에게 거절 알림 생성
        await createNotification(
          request.userId,
          'join_rejected',
          '가입 반려 안내',
          `${workspace.name} 팀 가입 신청이 반려되었습니다.`,
          workspace.id
        );
      }

      res.json({ message: `Request ${action}d successfully` });
    } catch (error) {
      console.error('Respond to join request error:', error);
      res.status(500).json({ error: 'Failed to respond to join request' });
    }
  },

  async updateMemberRole(req: AuthRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const { role } = req.body;
      const currentUserId = req.userId as number;

      const workspace = await prisma.workspace.findUnique({
        where: { id: parseInt(id) }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const currentUserMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId: currentUserId
        }
      });

      if (!currentUserMember || currentUserMember.role !== 'owner') {
        return res.status(403).json({ error: 'Only owner can change member roles' });
      }

      const memberToUpdate = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: parseInt(id),
          userId: parseInt(userId)
        }
      });

      if (!memberToUpdate) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (memberToUpdate.role === 'owner' && role !== 'owner') {
        const ownerCount = await prisma.workspaceMember.count({
          where: {
            workspaceId: parseInt(id),
            role: 'owner'
          }
        });
        if (ownerCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove the only owner' });
        }
      }

      const updatedMember = await prisma.workspaceMember.update({
        where: { id: memberToUpdate.id },
        data: { role: role as any }
      });

      // 실시간 알림 전송
      const io = getIO();
      if (io) {
        io.to(`team:${id}`).emit('member_updated', {
          workspaceId: parseInt(id),
          userId: parseInt(userId),
          role: updatedMember.role,
          action: 'update_role'
        });
      }

      res.json(updatedMember);
    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }
};
