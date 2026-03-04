import { Router } from 'express';
import { pageController } from '../controllers/pages';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthMiddleware, pageController.getPages);
router.get('/root', optionalAuthMiddleware, pageController.getRootPages);
router.get('/:id', optionalAuthMiddleware, pageController.getPage);
router.post('/', authMiddleware, pageController.createPage);
router.put('/:id', authMiddleware, pageController.updatePage);
router.delete('/:id', authMiddleware, pageController.deletePage);

export default router;
