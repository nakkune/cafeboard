import { Router } from 'express';
import { categoryController } from '../controllers/categories';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/', categoryController.createCategory);

export default router;
