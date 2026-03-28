import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getEquipment, getEquipmentById, createEquipment, updateEquipment, getMatrix, getUtilisation } from '../controllers/equipment';

const router = Router();
router.use(authenticate);

router.get('/matrix', getMatrix);
router.get('/utilisation', getUtilisation);
router.get('/', getEquipment);
router.get('/:id', getEquipmentById);
router.post('/', createEquipment);
router.put('/:id', updateEquipment);

export default router;
