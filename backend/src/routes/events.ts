import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/events';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getEvents);
router.post('/', authMiddleware, createEvent);
router.put('/:id', authMiddleware, updateEvent);
router.delete('/:id', authMiddleware, deleteEvent);

export default router;
