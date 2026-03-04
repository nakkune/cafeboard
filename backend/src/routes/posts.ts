import { Router } from 'express';
import { postController } from '../controllers/posts';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 반드시 /:id 라우트보다 먼저 정의해야 함
router.get('/search/all', postController.searchPosts);
router.get('/my-posts', authMiddleware, postController.getMyPosts);

router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);
router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

router.post('/:id/like', authMiddleware, postController.likePost);
router.post('/:id/scrap', authMiddleware, postController.scrapPost);

export default router;
