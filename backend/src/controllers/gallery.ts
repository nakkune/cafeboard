import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export const galleryController = {
    // 사진첩 목록 조회
    getGalleries: async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 12 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const [galleries, total] = await Promise.all([
                prisma.gallery.findMany({
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                nickname: true,
                                profileImage: true,
                            },
                        },
                        images: {
                            orderBy: { sortOrder: 'asc' },
                            take: 1, // 목록에서는 대표 이미지만
                        },
                        _count: {
                            select: { comments: true }
                        }
                    },
                }),
                prisma.gallery.count(),
            ]);

            res.json({
                galleries,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        } catch (error) {
            console.error('Fetch galleries error:', error);
            res.status(500).json({ error: 'Failed to fetch gallery posts' });
        }
    },

    // 사진첩 상세 조회
    getGalleryById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const gallery = await prisma.gallery.findUnique({
                where: { id: Number(id) },
                include: {
                    author: {
                        select: {
                            nickname: true,
                            profileImage: true,
                        },
                    },
                    images: {
                        orderBy: { sortOrder: 'asc' },
                    },
                    comments: {
                        include: {
                            author: {
                                select: {
                                    nickname: true,
                                    profileImage: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });

            if (!gallery) {
                return res.status(404).json({ error: 'Gallery post not found' });
            }

            // 조회수 증가
            await prisma.gallery.update({
                where: { id: Number(id) },
                data: { viewCount: { increment: 1 } },
            });

            res.json(gallery);
        } catch (error) {
            console.error('Fetch gallery detail error:', error);
            res.status(500).json({ error: 'Failed to fetch gallery detail' });
        }
    },

    // 사진첩 등록
    createGallery: async (req: AuthRequest, res: Response) => {
        try {
            const { title, content, images } = req.body; // images: string[]
            const authorId = req.userId;

            if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

            const gallery = await prisma.gallery.create({
                data: {
                    title,
                    content,
                    authorId,
                    images: {
                        create: images.map((url: string, index: number) => ({
                            imageUrl: url,
                            sortOrder: index,
                        })),
                    },
                },
                include: {
                    images: true,
                },
            });

            res.status(201).json(gallery);
        } catch (error) {
            console.error('Create gallery error:', error);
            res.status(500).json({ error: 'Failed to create gallery post' });
        }
    },

    // 사진첩 삭제
    deleteGallery: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const authorId = req.userId;

            if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

            const gallery = await prisma.gallery.findUnique({
                where: { id: Number(id) },
            });

            if (!gallery) {
                return res.status(404).json({ error: 'Gallery post not found' });
            }

            // 작성자 정보 또는 관리자 권한 확인
            const user = await prisma.user.findUnique({
                where: { id: authorId },
                select: { role: true }
            });

            const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

            if (gallery.authorId !== authorId && !isAdmin) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            await prisma.gallery.delete({
                where: { id: Number(id) },
            });

            res.json({ message: 'Gallery post deleted successfully' });
        } catch (error) {
            console.error('Delete gallery error:', error);
            res.status(500).json({ error: 'Failed to delete gallery post' });
        }
    },

    // 사진첩 댓글 등록
    createComment: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const authorId = req.userId;

            if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

            const comment = await prisma.galleryComment.create({
                data: {
                    content,
                    galleryId: Number(id),
                    authorId,
                },
                include: {
                    author: {
                        select: {
                            nickname: true,
                            profileImage: true,
                        },
                    },
                },
            });

            res.status(201).json(comment);
        } catch (error) {
            console.error('Create gallery comment error:', error);
            res.status(500).json({ error: 'Failed to create comment' });
        }
    },
};
