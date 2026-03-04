import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import type { AuthRequest } from '../middleware/auth';

export const blockController = {
  async getBlocks(req: Request, res: Response) {
    try {
      const { pageId } = req.params;
      const userId = (req as any).userId;

      const page = await prisma.page.findUnique({
        where: { id: parseInt(pageId) }
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (!page.isPublic && page.authorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const blocks = await prisma.block.findMany({
        where: { pageId: parseInt(pageId) },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
      });

      res.json({ blocks });
    } catch (error) {
      console.error('Get blocks error:', error);
      res.status(500).json({ error: 'Failed to fetch blocks' });
    }
  },

  async createBlock(req: AuthRequest, res: Response) {
    try {
      const { pageId } = req.params;
      const { type, content, properties, parentId, position } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = await prisma.page.findUnique({
        where: { id: parseInt(pageId) }
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (page.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const maxPosition = await prisma.block.aggregate({
        where: { pageId: parseInt(pageId) },
        _max: { position: true }
      });

      const block = await prisma.block.create({
        data: {
          pageId: parseInt(pageId),
          type,
          content: content || {},
          properties,
          parentId: parentId || null,
          position: position ?? ((maxPosition._max.position ?? -1) + 1)
        }
      });

      res.status(201).json({ block });
    } catch (error) {
      console.error('Create block error:', error);
      res.status(500).json({ error: 'Failed to create block' });
    }
  },

  async updateBlock(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, properties, position } = req.body;
      const userId = req.userId;

      const block = await prisma.block.findUnique({
        where: { id: parseInt(id) },
        include: { page: true }
      });

      if (!block) {
        return res.status(404).json({ error: 'Block not found' });
      }

      if (block.page.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updatedBlock = await prisma.block.update({
        where: { id: parseInt(id) },
        data: {
          ...(content !== undefined && { content }),
          ...(properties !== undefined && { properties }),
          ...(position !== undefined && { position })
        }
      });

      res.json({ block: updatedBlock });
    } catch (error) {
      console.error('Update block error:', error);
      res.status(500).json({ error: 'Failed to update block' });
    }
  },

  async deleteBlock(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const block = await prisma.block.findUnique({
        where: { id: parseInt(id) },
        include: { page: true }
      });

      if (!block) {
        return res.status(404).json({ error: 'Block not found' });
      }

      if (block.page.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.block.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Block deleted successfully' });
    } catch (error) {
      console.error('Delete block error:', error);
      res.status(500).json({ error: 'Failed to delete block' });
    }
  },

  async reorderBlocks(req: AuthRequest, res: Response) {
    try {
      const { pageId } = req.params;
      const { blockIds } = req.body;
      const userId = req.userId;

      if (!Array.isArray(blockIds)) {
        return res.status(400).json({ error: 'blockIds must be an array' });
      }

      const page = await prisma.page.findUnique({
        where: { id: parseInt(pageId) }
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (page.authorId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await Promise.all(
        blockIds.map((blockId, index) =>
          prisma.block.update({
            where: { id: blockId },
            data: { position: index }
          })
        )
      );

      res.json({ message: 'Blocks reordered successfully' });
    } catch (error) {
      console.error('Reorder blocks error:', error);
      res.status(500).json({ error: 'Failed to reorder blocks' });
    }
  }
};
