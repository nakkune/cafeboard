import { Router } from 'express';
import { reportController } from '../controllers/reports';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 신고 생성 (회원만 가능하게 하거나 필요한 경우 authMiddleware 조정)
router.post('/', authMiddleware, reportController.createReport);

export default router;
