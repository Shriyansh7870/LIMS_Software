import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, downloadDocument } from '../controllers/documents';

const router = Router();
router.use(authenticate);

router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
