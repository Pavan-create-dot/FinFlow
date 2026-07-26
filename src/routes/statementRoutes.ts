import { Router } from 'express';
import multer from 'multer';
import { uploadStatement, getStatements, deleteStatement } from '../controllers/statementController';
import { authenticateJWT } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import { uploadStatementSchema } from '../dtos/statement.dto';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticateJWT, upload.single('statement'), validateRequest(uploadStatementSchema), uploadStatement);
router.get('/', authenticateJWT, getStatements);
router.delete('/:id', authenticateJWT, deleteStatement);

export default router;
