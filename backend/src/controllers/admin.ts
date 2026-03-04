import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

interface ReportType {
  id: number;
  reporterId: number | null;
  targetType: string;
  targetId: number;
  reason: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

interface UserRoleCount {
  role: string;
  _count: { role: number };
}

export const adminController = {
  // 회원 목록 조회
  async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const search = (req.query.search as string) || '';
      const role = req.query.role as string;
      const status = req.query.status as string;

      const where: any = {};

      // 검색 조건
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { nickname: { contains: search, mode: 'insensitive' } }
        ];
      }

      // 역할 필터
      if (role && ['member', 'moderator', 'admin'].includes(role)) {
        where.role = role;
      }

      // 승인 상태 필터
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        where.memberStatus = status;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            nickname: true,
            name: true,
            phone: true,
            gender: true,
            profileImage: true,
            role: true,
            memberStatus: true,
            memberLevel: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            approvedAt: true,
            _count: {
              select: {
                posts: true,
                comments: true,
                reports: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // 사용자 권한 변경
  async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = req.userId;

      if (!role || !['member', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // 자기 자신의 권한은 변경 불가
      if (parseInt(id) === adminId) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { role },
        select: {
          id: true,
          email: true,
          nickname: true,
          role: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'User role updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  },

  // 신고 목록 조회
  async getReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const where: any = {};

      // 상태 필터
      if (status && ['pending', 'resolved', 'rejected'].includes(status)) {
        where.status = status;
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: {
            reporter: {
              select: {
                id: true,
                nickname: true,
                email: true
              }
            }
          },
          orderBy: [
            { status: 'asc' }, // pending 먼저
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.report.count({ where })
      ]);

      // 신고 대상 정보 추가 조회
      const reportsWithTarget = await Promise.all(
        reports.map(async (report: ReportType) => {
          let target = null;

          if (report.targetType === 'post') {
            target = await prisma.post.findUnique({
              where: { id: report.targetId },
              select: {
                id: true,
                title: true,
                author: {
                  select: { id: true, nickname: true }
                }
              }
            });
          } else if (report.targetType === 'comment') {
            target = await prisma.comment.findUnique({
              where: { id: report.targetId },
              select: {
                id: true,
                content: true,
                author: {
                  select: { id: true, nickname: true }
                }
              }
            });
          } else if (report.targetType === 'video') {
            target = await prisma.video.findUnique({
              where: { id: report.targetId },
              select: {
                id: true,
                title: true,
                author: {
                  select: { id: true, nickname: true }
                }
              }
            });
          }

          return {
            ...report,
            target
          };
        })
      );

      res.json({
        reports: reportsWithTarget,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  },

  // 신고 처리
  async resolveReport(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, action } = req.body;

      if (!status || !['resolved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const report = await prisma.report.findUnique({
        where: { id: parseInt(id) }
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      if (report.status !== 'pending') {
        return res.status(400).json({ error: 'Report already processed' });
      }

      // 신고 상태 업데이트
      const updatedReport = await prisma.report.update({
        where: { id: parseInt(id) },
        data: {
          status,
          resolvedAt: new Date()
        }
      });

      // 조치 수행 (선택적)
      if (action && status === 'resolved') {
        if (action === 'hide' && report.targetType === 'post') {
          await prisma.post.update({
            where: { id: report.targetId },
            data: { status: 'hidden' }
          });
        } else if (action === 'hide' && report.targetType === 'comment') {
          await prisma.comment.update({
            where: { id: report.targetId },
            data: { isDeleted: true, content: '관리자에 의해 삭제된 댓글입니다.' }
          });
        } else if (action === 'hide' && report.targetType === 'video') {
          await prisma.video.update({
            where: { id: report.targetId },
            data: { status: 'hidden' }
          });
        }
      }

      res.json({
        message: 'Report processed successfully',
        report: updatedReport
      });
    } catch (error) {
      console.error('Resolve report error:', error);
      res.status(500).json({ error: 'Failed to process report' });
    }
  },

  // 통계 데이터 조회 (일별 추이 포함)
  async getStats(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        newUsersToday,
        totalPosts,
        newPostsToday,
        totalComments,
        newCommentsToday,
        pendingReports,
        totalReports,
        usersByRole
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.post.count({ where: { status: 'published' } }),
        prisma.post.count({ where: { status: 'published', createdAt: { gte: today } } }),
        prisma.comment.count({ where: { isDeleted: false } }),
        prisma.comment.count({ where: { isDeleted: false, createdAt: { gte: today } } }),
        prisma.report.count({ where: { status: 'pending' } }),
        prisma.report.count(),
        prisma.user.groupBy({ by: ['role'], _count: { role: true } })
      ]);

      const dailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const [uCount, pCount] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: d, lt: nextD } } }),
          prisma.post.count({ where: { createdAt: { gte: d, lt: nextD }, status: 'published' } })
        ]);

        dailyStats.push({
          date: d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          users: Number(uCount),
          posts: Number(pCount)
        });
      }

      res.json({
        overview: {
          totalUsers: Number(totalUsers),
          newUsersToday: Number(newUsersToday),
          totalPosts: Number(totalPosts),
          newPostsToday: Number(newPostsToday),
          totalComments: Number(totalComments),
          newCommentsToday: Number(newCommentsToday),
          pendingReports: Number(pendingReports),
          totalReports: Number(totalReports)
        },
        usersByRole: usersByRole.map((r: UserRoleCount) => ({
          role: r.role,
          count: Number(r._count.role)
        })),
        dailyStats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // 사용자 활성화/비활성화 (관리자 전용)
  async toggleUserStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const adminId = req.userId;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be boolean' });
      }

      // 자기 자신은 비활성화 불가
      if (parseInt(id) === adminId) {
        return res.status(400).json({ error: 'Cannot deactivate yourself' });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isActive },
        select: {
          id: true,
          email: true,
          nickname: true,
          isActive: true,
          role: true
        }
      });

      res.json({
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  },

  // 회원 승인/거절
  async approveMember(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, rejectionReason, memberLevel } = req.body;
      const adminId = req.userId;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updateData: any = {
        memberStatus: status,
      };

      if (status === 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = adminId;
      } else if (status === 'rejected') {
        updateData.rejectionReason = rejectionReason || null;
      }

      if (memberLevel && ['regular', 'general', 'nonmember'].includes(memberLevel)) {
        updateData.memberLevel = memberLevel;
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          nickname: true,
          name: true,
          phone: true,
          gender: true,
          memberStatus: true,
          memberLevel: true,
          approvedAt: true,
          approvedBy: true,
          rejectionReason: true,
          updatedAt: true
        }
      });

      res.json({
        message: `Member ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Approve member error:', error);
      res.status(500).json({ error: 'Failed to approve member' });
    }
  },

  // 회원等级 변경
  async updateMemberLevel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { memberLevel } = req.body;

      if (!memberLevel || !['regular', 'general', 'nonmember'].includes(memberLevel)) {
        return res.status(400).json({ error: 'Invalid memberLevel. Must be regular, general, or nonmember' });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { memberLevel },
        select: {
          id: true,
          email: true,
          nickname: true,
          memberLevel: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Member level updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update member level error:', error);
      res.status(500).json({ error: 'Failed to update member level' });
    }
  },

  // 관리자용 게시물 전체 조회
  getAdminPosts: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (status) {
        where.status = status;
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: { select: { id: true, nickname: true, email: true } },
            category: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.post.count({ where })
      ]);

      res.json({
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Admin get posts error:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  },

  // 게시물 상태 변경 (숨김/공개 등)
  updatePostStatus: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedPost = await prisma.post.update({
        where: { id: parseInt(id) },
        data: { status },
        include: { author: { select: { nickname: true } } }
      });

      res.json({ message: 'Post status updated', post: updatedPost });
    } catch (error) {
      console.error('Admin update post status error:', error);
      res.status(500).json({ error: 'Failed to update post status' });
    }
  },

  // 관리자용 댓글 전체 조회
  getAdminComments: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          include: {
            author: { select: { id: true, nickname: true } },
            post: { select: { id: true, title: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.comment.count()
      ]);

      res.json({
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Admin get comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  // 댓글 삭제 (물리적 삭제 또는 상태 변경)
  deleteComment: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // 물리 삭제 대신 isDeleted 플래그 업데이트 (데이터 보존을 위해)
      const deletedComment = await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { isDeleted: true }
      });

      res.json({ message: 'Comment marked as deleted', comment: deletedComment });
    } catch (error) {
      console.error('Admin delete comment error:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  },

  // 시스템 설정 조회
  getSystemSettings: async (req: Request, res: Response) => {
    try {
      const settings = await prisma.systemSetting.findMany();
      // 배열을 객체 형태로 변환하여 프론트엔드에서 쓰기 편하게 전달
      const settingsMap = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      res.json(settingsMap);
    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({ error: 'Failed to fetch system settings' });
    }
  },

  // 시스템 설정 업데이트 (일괄 업데이트 지원)
  updateSystemSettings: async (req: AuthRequest, res: Response) => {
    try {
      const { settings } = req.body; // { "site_name": "New Name", "maintenance_mode": "true" } 형태

      const updatePromises = Object.entries(settings).map(([key, value]) => {
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: value as string },
          create: {
            key,
            value: value as string,
            type: typeof value === 'boolean' ? 'boolean' : 'string'
          }
        });
      });

      await Promise.all(updatePromises);
      res.json({ message: 'System settings updated successfully' });
    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({ error: 'Failed to update system settings' });
    }
  }
};
