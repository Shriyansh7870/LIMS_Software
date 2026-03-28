import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPartnerPerformance, getQualityScoreTrend, getCapaResolutionTime, getCertComplianceRate } from '../controllers/analytics';

const router = Router();
router.use(authenticate);

router.get('/partner-performance', getPartnerPerformance);
router.get('/quality-score-trend', getQualityScoreTrend);
router.get('/capa-resolution-time', getCapaResolutionTime);
router.get('/cert-compliance-rate', getCertComplianceRate);

export default router;
