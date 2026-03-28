import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLabs, getLabById, createLab, updateLab, deleteLab, getLabHistory } from '../controllers/labs';

const router = Router();
router.use(authenticate);

router.get('/', getLabs);
router.get('/:id/history', getLabHistory);
router.get('/:id', getLabById);
router.post('/', createLab);
router.put('/:id', updateLab);
router.delete('/:id', deleteLab);

export default router;
