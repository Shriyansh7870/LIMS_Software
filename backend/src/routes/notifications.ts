import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNotifications, markRead, getUnreadCount } from '../controllers/notifications';

const router = Router();
router.use(authenticate);

router.get('/unread-count', getUnreadCount);
router.get('/', getNotifications);
router.put('/:id/read', markRead);

export default router;
