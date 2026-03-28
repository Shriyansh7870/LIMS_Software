import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAudits, getAuditById, createAudit, updateAudit, getScoreTrend, getCalendar } from '../controllers/audits';

const router = Router();
router.use(authenticate);

router.get('/score-trend', getScoreTrend);
router.get('/calendar', getCalendar);
router.get('/', getAudits);
router.get('/:id', getAuditById);
router.post('/', createAudit);
router.put('/:id', updateAudit);

export default router;
