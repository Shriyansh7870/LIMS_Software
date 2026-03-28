import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPartners, getPartnerById, createPartner, updatePartner, findPartners, getPartnerScorecard } from '../controllers/partners';

const router = Router();
router.use(authenticate);

router.get('/finder', findPartners);
router.get('/:id/scorecard', getPartnerScorecard);
router.get('/', getPartners);
router.get('/:id', getPartnerById);
router.post('/', createPartner);
router.put('/:id', updatePartner);

export default router;
