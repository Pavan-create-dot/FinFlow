import { Router } from 'express';
import multer from 'multer';
import { uploadStatement, getStatements } from '../controllers/statementController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticateJWT, upload.single('statement'), uploadStatement);
router.get('/', authenticateJWT, getStatements);

export default router;
