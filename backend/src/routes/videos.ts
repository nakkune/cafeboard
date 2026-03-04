import { Router } from 'express';
import { videoController } from '../controllers/videos';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/my-videos', authMiddleware, videoController.getMyVideos);

router.get('/', videoController.getVideos);
router.get('/:id', videoController.getVideo);
router.post('/', authMiddleware, videoController.createVideo);
router.put('/:id', authMiddleware, videoController.updateVideo);
router.delete('/:id', authMiddleware, videoController.deleteVideo);

export default router;
