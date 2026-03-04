import { Router } from 'express';
import { channelController } from '../controllers/channel';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, channelController.getChannels);
router.post('/', authMiddleware, channelController.createChannel);
router.get('/:channelId', authMiddleware, channelController.getChannel);
router.put('/:channelId', authMiddleware, channelController.updateChannel);
router.delete('/:channelId', authMiddleware, channelController.deleteChannel);

router.get('/:channelId/members', authMiddleware, channelController.getMembers);
router.post('/:channelId/members', authMiddleware, channelController.addMember);
router.delete('/:channelId/members/:userId', authMiddleware, channelController.removeMember);

export default router;
