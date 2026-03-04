import { Router } from 'express';
import { searchController } from '../controllers/search';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/messages', authMiddleware, searchController.searchMessages);
router.get('/channels', authMiddleware, searchController.searchChannels);
router.get('/users', authMiddleware, searchController.searchUsers);
router.get('/teams', authMiddleware, searchController.searchTeams);

export default router;
