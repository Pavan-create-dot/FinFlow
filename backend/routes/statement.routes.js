const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const AIService = require('../services/ai.service');
const { authenticateJWT } = require('../middleware/auth');
const { encrypt, decrypt } = require('../services/encryption');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Process PDF statement helper
const processPdfDirect = async (statementId, userId, filePath) => {
  try {
    await Statement.findByIdAndUpdate(statementId, { status: 'PROCESSING' });

    // 1. Read & parse PDF text
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    const rawText = pdfData.text || '';

    // 2. Extract transactions via Gemini AI / fallback regex
    const transactions = await AIService.extractTransactions(rawText);

    // 3. Category mapping
    const categories = await Category.find();
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase().trim(), c._id]));
    const otherCatId = categoryMap.get('other') || null;

    const docsToInsert = transactions.map(t => {
      const rawCat = (t.category || '').toLowerCase().trim();
      let categoryId = categoryMap.get(rawCat) || null;
      if (!categoryId) {
        for (const [name, id] of categoryMap.entries()) {
          if (rawCat.includes(name) || name.includes(rawCat)) {
            categoryId = id;
            break;
          }
        }
      }
      if (!categoryId) categoryId = otherCatId;

      return {
        userId,
        statementId,
        date: new Date(t.date),
        amount: Number(t.amount),
        description: encrypt(t.description),
        merchantName: t.merchantName ? encrypt(t.merchantName) : null,
        type: t.type,
        originalText: encrypt(t.description),
        isSubscription: Boolean(t.isSubscription),
        categoryId,
      };
    });

    if (docsToInsert.length > 0) {
      await Transaction.insertMany(docsToInsert);
    }

    await Statement.findByIdAndUpdate(statementId, { status: 'COMPLETED' });

    // Cleanup uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    await Statement.findByIdAndUpdate(statementId, {
      status: 'FAILED',
      errorMessage: encrypt(error.message || 'Failed to parse PDF document')
    });
  }
};

// Upload & Process Statement
router.post('/upload', authenticateJWT, upload.single('statement'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a PDF statement to upload' });
    }

    const userId = req.user.id;
    const { bankName } = req.body;

    const encryptedFileName = encrypt(req.file.originalname);
    const encryptedFileUrl = encrypt(req.file.path);

    const statement = await Statement.create({
      userId,
      fileName: encryptedFileName,
      fileUrl: encryptedFileUrl,
      bankName: bankName || 'Unknown Bank',
      status: 'PROCESSING',
    });

    // Process asynchronously so user gets instant response
    processPdfDirect(statement.id, userId, req.file.path);

    res.status(202).json({
      message: 'Statement uploaded and queued for processing',
      statementId: statement.id,
    });
  } catch (error) {
    next(error);
  }
});

// List User Statements
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const statements = await Statement.find({ userId }).sort({ createdAt: -1 });

    const decryptedStatements = statements.map(s => {
      const json = s.toJSON();
      return {
        ...json,
        fileName: decrypt(json.fileName) || '',
        fileUrl: json.fileUrl ? decrypt(json.fileUrl) : null,
        errorMessage: json.errorMessage ? decrypt(json.errorMessage) : null,
      };
    });

    res.json(decryptedStatements);
  } catch (error) {
    next(error);
  }
});

// Delete Statement
router.delete('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const statement = await Statement.findOne({ _id: req.params.id, userId });

    if (!statement) {
      return res.status(404).json({ error: 'Statement not found' });
    }

    await Transaction.deleteMany({ statementId: req.params.id });
    await Statement.deleteOne({ _id: req.params.id });

    res.json({ message: 'Statement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
