import { Request, Response } from 'express';
import { prisma } from '../utils/db';

export const categoryController = {
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  async getCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const posts = await prisma.post.findMany({
        where: {
          categoryId: parseInt(id),
          status: 'published'
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              profileImage: true,
            }
          }
        },
        orderBy: [
          { isNotice: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      });

      const total = await prisma.post.count({
        where: {
          categoryId: parseInt(id),
          status: 'published'
        }
      });

      res.json({
        category,
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  },

  async createCategory(req: Request, res: Response) {
    try {
      const { name, description, sortOrder, readPermission, writePermission } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          description,
          sortOrder: sortOrder || 0,
          readPermission: readPermission || 'all',
          writePermission: writePermission || 'member',
        }
      });

      res.status(201).json({ category });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  },
};
