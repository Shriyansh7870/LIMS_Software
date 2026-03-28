import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWorkflows, getWorkflowById, startRun, getActiveRuns, getRunById, advanceStep } from '../controllers/workflows';

const router = Router();
router.use(authenticate);

router.get('/workflow-runs', getActiveRuns);
router.get('/workflow-runs/:id', getRunById);
router.put('/workflow-runs/:id/steps/:stepId', advanceStep);
router.get('/', getWorkflows);
router.get('/:id', getWorkflowById);
router.post('/:id/runs', startRun);

export default router;
