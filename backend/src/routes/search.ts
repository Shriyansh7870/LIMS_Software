import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { globalSearch } from '../controllers/search';

const router = Router();
router.use(authenticate);

router.get('/', globalSearch);

export default router;
