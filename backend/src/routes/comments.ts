import { Router } from 'express';
import { commentController } from '../controllers/comments';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 댓글 목록 조회 (인증 불필요)
router.get('/:postId', commentController.getComments);

// 댓글 작성 (인증 필요)
router.post('/', authMiddleware, commentController.createComment);

// 댓글 수정 (인증 필요)
router.put('/:id', authMiddleware, commentController.updateComment);

// 댓글 삭제 (인증 필요)
router.delete('/:id', authMiddleware, commentController.deleteComment);

// 댓글 추천 (인증 필요)
router.post('/:id/like', authMiddleware, commentController.likeComment);

export default router;
