import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCertifications, getCertificationById, createCertification, updateCertification,
  getExpiryTimeline, getCertHealthChart,
} from '../controllers/certifications';

const router = Router();
router.use(authenticate);

router.get('/expiry-timeline', getExpiryTimeline);
router.get('/health-chart', getCertHealthChart);
router.get('/', getCertifications);
router.get('/:id', getCertificationById);
router.post('/', createCertification);
router.put('/:id', updateCertification);

export default router;
