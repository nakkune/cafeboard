import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const pageController = {
  async getPages(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : null;
      const spaceType = req.query.spaceType as string;

      const pages = await prisma.page.findMany({
        where: {
          parentId,
          isArchived: false,
          ...(spaceType && { spaceType: spaceType as any }),
          OR: [
            { isPublic: true },
            { authorId: userId }
          ]
        },
        include: {
          author: {
            select: { id: true, nickname: true, profileImage: true }
          },
          children: {
            where: { isArchived: false },
            select: { id: true, title: true, icon: true }
          }
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }]
      });

      res.json({ pages });
    } catch (error) {
      console.error('Get pages error:', error);
      res.status(500).json({ error: 'Failed to fetch pages' });
    }
  },

  async getPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const page = await prisma.page.findUnique({
        where: { id: parseInt(id) },
        include: {
          author: {
            select: { id: true, nickname: true, profileImage: true }
          },
          blocks: {
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
          },
          children: {
            where: { isArchived: false },
            orderBy: [{ position: 'asc' }, { createdAt: 'desc' }]
          }
        }
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (!page.isPublic && page.authorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ page });
    } catch (error) {
      console.error('Get page error:', error);
      res.status(500).json({ error: 'Failed to fetch page' });
    }
  },

  async createPage(req: AuthRequest, res: Response) {
    try {
      const { title, icon, cover, parentId, isPublic, spaceType } = req.body;
      const authorId = req.userId;

      if (!authorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = await prisma.page.create({
        data: {
          title: title || 'Untitled',
          icon,
          cover,
          parentId: parentId || null,
          authorId,
          isPublic: isPublic ?? true,
          spaceType: spaceType || 'personal'
        },
        include: {
          author: {
            select: { id: true, nickname: true, profileImage: true }
          }
        }
      });

      res.status(201).json({ page });
    } catch (error) {
      console.error('Create page error:', error);
      res.status(500).json({ error: 'Failed to create page' });
    }
  },

  async updatePage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, icon, cover, parentId, isPublic, isArchived, position, content, spaceType } = req.body;
      const userId = req.userId;

      const existingPage = await prisma.page.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingPage) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (existingPage.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const page = await prisma.page.update({
        where: { id: parseInt(id) },
        data: {
          ...(title && { title }),
          ...(icon !== undefined && { icon }),
          ...(cover !== undefined && { cover }),
          ...(parentId !== undefined && { parentId }),
          ...(isPublic !== undefined && { isPublic }),
          ...(isArchived !== undefined && { isArchived }),
          ...(position !== undefined && { position }),
          ...(content !== undefined && { content }),
          ...(spaceType !== undefined && { spaceType })
        },
        include: {
          author: {
            select: { id: true, nickname: true, profileImage: true }
          }
        }
      });

      res.json({ page });
    } catch (error) {
      console.error('Update page error:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  },

  async deletePage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const existingPage = await prisma.page.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingPage) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (existingPage.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.page.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Delete page error:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  },

  async getRootPages(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const spaceType = req.query.spaceType as string;

      const pages = await prisma.page.findMany({
        where: {
          parentId: null,
          isArchived: false,
          ...(spaceType && { spaceType: spaceType as any }),
          OR: [
            { isPublic: true },
            { authorId: userId }
          ]
        },
        include: {
          author: {
            select: { id: true, nickname: true, profileImage: true }
          },
          children: {
            where: { isArchived: false },
            select: { id: true, title: true, icon: true }
          }
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }]
      });

      res.json({ pages });
    } catch (error) {
      console.error('Get root pages error:', error);
      res.status(500).json({ error: 'Failed to fetch root pages' });
    }
  }
};
