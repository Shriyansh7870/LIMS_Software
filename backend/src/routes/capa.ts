import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCapas, getCapaById, createCapa, updateCapa, getMonthlyTrend, getBySeverity } from '../controllers/capa';

const router = Router();
router.use(authenticate);

router.get('/monthly-trend', getMonthlyTrend);
router.get('/by-severity', getBySeverity);
router.get('/', getCapas);
router.get('/:id', getCapaById);
router.post('/', createCapa);
router.put('/:id', updateCapa);

export default router;
