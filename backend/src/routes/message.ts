import { Router } from 'express';
import { messageController } from '../controllers/message';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/channels/:channelId/messages', authMiddleware, messageController.getMessages);
router.post('/channels/:channelId/messages', authMiddleware, messageController.createMessage);

router.get('/messages/:messageId', authMiddleware, messageController.getMessage);
router.get('/messages/:messageId/thread', authMiddleware, messageController.getThreadMessages);
router.put('/messages/:messageId', authMiddleware, messageController.updateMessage);
router.delete('/messages/:messageId', authMiddleware, messageController.deleteMessage);

router.post('/messages/:messageId/reactions', authMiddleware, messageController.addReaction);
router.delete('/messages/:messageId/reactions/:emoji', authMiddleware, messageController.removeReaction);

router.post('/channels/:channelId/read', authMiddleware, messageController.markAsRead);

export default router;
