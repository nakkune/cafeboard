import { Router } from 'express';
import { conversationController } from '../controllers/conversation';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, conversationController.getConversations);
router.post('/', authMiddleware, conversationController.createConversation);
router.get('/:id', authMiddleware, conversationController.getConversation);
router.put('/:id', authMiddleware, conversationController.updateConversation);
router.delete('/:id', authMiddleware, conversationController.deleteConversation);

router.get('/:id/messages', authMiddleware, conversationController.getMessages);
router.post('/:id/messages', authMiddleware, conversationController.createMessage);

router.get('/:id/participants', authMiddleware, conversationController.getParticipants);
router.post('/:id/participants', authMiddleware, conversationController.addParticipant);
router.put('/:id/participants/:userId', authMiddleware, conversationController.updateParticipant);
router.delete('/:id/participants/:userId', authMiddleware, conversationController.removeParticipant);

export default router;
