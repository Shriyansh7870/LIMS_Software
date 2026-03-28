import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getRequests, getRequestById, createRequest, updateRequest, getMonthlyVolume, getByLab } from '../controllers/requests';

const router = Router();
router.use(authenticate);

router.get('/monthly-volume', getMonthlyVolume);
router.get('/by-lab', getByLab);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.put('/:id', updateRequest);

export default router;
