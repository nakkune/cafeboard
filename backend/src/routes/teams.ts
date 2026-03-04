import { Router } from 'express';
import { workspaceController } from '../controllers/workspace';
import { channelController } from '../controllers/channel';
import { messageController } from '../controllers/message';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, workspaceController.getWorkspaces);
router.post('/', authMiddleware, workspaceController.createWorkspace);
router.get('/public', authMiddleware, workspaceController.getPublicWorkspaces);
router.post('/:id/join', authMiddleware, workspaceController.joinWorkspace);
router.get('/:id/join-requests', authMiddleware, workspaceController.getJoinRequests);
router.post('/:id/join-requests/:requestId', authMiddleware, workspaceController.respondToJoinRequest);
router.get('/:id', authMiddleware, workspaceController.getWorkspace);
router.put('/:id', authMiddleware, workspaceController.updateWorkspace);
router.delete('/:id', authMiddleware, workspaceController.deleteWorkspace);

router.get('/:id/members', authMiddleware, workspaceController.getMembers);
router.post('/:id/members', authMiddleware, workspaceController.addMember);
router.put('/:id/members/:userId', authMiddleware, workspaceController.updateMemberRole);
router.delete('/:id/members/:userId', authMiddleware, workspaceController.removeMember);

router.get('/:workspaceId/channels', authMiddleware, channelController.getChannels);
router.post('/:workspaceId/channels', authMiddleware, channelController.createChannel);
router.get('/:workspaceId/channels/:channelId', authMiddleware, channelController.getChannel);
router.put('/:workspaceId/channels/:channelId', authMiddleware, channelController.updateChannel);
router.delete('/:workspaceId/channels/:channelId', authMiddleware, channelController.deleteChannel);

router.get('/:workspaceId/channels/:channelId/members', authMiddleware, channelController.getMembers);
router.post('/:workspaceId/channels/:channelId/members', authMiddleware, channelController.addMember);
router.put('/:workspaceId/channels/:channelId/members/:userId', authMiddleware, channelController.updateMemberRole);
router.delete('/:workspaceId/channels/:channelId/members/:userId', authMiddleware, channelController.removeMember);

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
