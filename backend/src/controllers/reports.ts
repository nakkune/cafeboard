import { Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const reportController = {
    // 신고 생성
    async createReport(req: AuthRequest, res: Response) {
        try {
            const { targetType, targetId, reason } = req.body;
            const reporterId = req.userId;

            if (!targetType || !targetId || !reason?.trim()) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 대상 존재 여부 확인
            if (targetType === 'post') {
                const post = await prisma.post.findUnique({ where: { id: parseInt(targetId) } });
                if (!post) return res.status(404).json({ error: 'Post not found' });
            } else if (targetType === 'comment') {
                const comment = await prisma.comment.findUnique({ where: { id: parseInt(targetId) } });
                if (!comment) return res.status(404).json({ error: 'Comment not found' });
            } else if (targetType === 'video') {
                const video = await prisma.video.findUnique({ where: { id: parseInt(targetId) } });
                if (!video) return res.status(404).json({ error: 'Video not found' });
            } else {
                return res.status(400).json({ error: 'Invalid target type' });
            }

            const report = await prisma.report.create({
                data: {
                    targetType,
                    targetId: parseInt(targetId),
                    reason,
                    reporterId: reporterId || null,
                    status: 'pending'
                }
            });

            res.status(201).json({
                message: '신고가 접수되었습니다.',
                report
            });
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({ error: 'Failed to create report' });
        }
    }
};
