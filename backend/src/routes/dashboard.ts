import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getKpis, getTrends, getUpcoming, getEquipmentDist, getCertHealth, getPartnerMap } from '../controllers/dashboard';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Executive dashboard data
 */

router.get('/kpis', getKpis);
router.get('/trends', getTrends);
router.get('/upcoming', getUpcoming);
router.get('/equipment-dist', getEquipmentDist);
router.get('/cert-health', getCertHealth);
router.get('/partner-map', getPartnerMap);

export default router;
