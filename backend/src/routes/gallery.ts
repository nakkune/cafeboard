import { Router } from 'express';
import { galleryController } from '../controllers/gallery';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// /api/gallery/...
router.get('/', galleryController.getGalleries);
router.get('/:id', galleryController.getGalleryById);
router.post('/', authMiddleware, galleryController.createGallery);
router.post('/:id/comments', authMiddleware, galleryController.createComment);
router.delete('/:id', authMiddleware, galleryController.deleteGallery);

export default router;
