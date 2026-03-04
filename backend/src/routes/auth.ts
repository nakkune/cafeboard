import { Router } from 'express';
import { authController } from '../controllers/auth';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Forgot password endpoint' });
});

router.put('/reset-password', (req, res) => {
  res.json({ message: 'Reset password endpoint' });
});

export default router;
