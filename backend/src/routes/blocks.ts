import { Router } from 'express';
import { blockController } from '../controllers/blocks';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/pages/:pageId/blocks', blockController.getBlocks);
router.post('/pages/:pageId/blocks', authMiddleware, blockController.createBlock);
router.put('/blocks/:id', authMiddleware, blockController.updateBlock);
router.delete('/blocks/:id', authMiddleware, blockController.deleteBlock);
router.put('/pages/:pageId/blocks/reorder', authMiddleware, blockController.reorderBlocks);

export default router;
