import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getSops, getSopById, createSop, updateSop, addVersion, getDueForReview } from '../controllers/sops';

const router = Router();
router.use(authenticate);

router.get('/due-for-review', getDueForReview);
router.get('/', getSops);
router.get('/:id', getSopById);
router.post('/', createSop);
router.put('/:id', updateSop);
router.post('/:id/versions', addVersion);

export default router;
