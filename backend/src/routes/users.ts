import { Router } from 'express';
import { userController } from '../controllers/users';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/me', authMiddleware, userController.getMe);
router.put('/me', authMiddleware, userController.updateMe);
router.put('/me/password', authMiddleware, userController.changePassword);
router.put('/me/image', authMiddleware, userController.updateProfileImage);
router.get('/me/scraps', authMiddleware, userController.getMyScraps);
router.get('/:id/posts', userController.getUserPosts);

export default router;
