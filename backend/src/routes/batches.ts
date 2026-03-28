import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getBatches, getBatchById, createBatch, updateBatch, getMonthlyOutput, getYieldTrend } from '../controllers/batches';

const router = Router();
router.use(authenticate);

router.get('/monthly-output', getMonthlyOutput);
router.get('/yield-trend', getYieldTrend);
router.get('/', getBatches);
router.get('/:id', getBatchById);
router.post('/', createBatch);
router.put('/:id', updateBatch);

export default router;
