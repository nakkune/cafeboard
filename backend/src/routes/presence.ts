import { Router } from 'express';
import { presenceController } from '../controllers/presence';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/users/:userId/presence', authMiddleware, presenceController.getPresence);
router.get('/teams/:teamId/presence', authMiddleware, presenceController.getTeamPresence);
router.put('/presence', authMiddleware, presenceController.updatePresence);
router.post('/presence/online', authMiddleware, presenceController.setOnline);
router.post('/presence/offline', authMiddleware, presenceController.setOffline);

export default router;
