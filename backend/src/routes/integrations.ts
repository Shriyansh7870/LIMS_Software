import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getIntegrations, createIntegration, updateIntegration } from '../controllers/integrations';

const router = Router();
router.use(authenticate);

router.get('/', getIntegrations);
router.post('/', createIntegration);
router.put('/:id', updateIntegration);

export default router;
