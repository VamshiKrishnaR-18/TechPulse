import express from 'express';
import { saveAnalysis, getHistory, getMetrics, streamAnalysis } from '../controllers/analysisController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { analysisQuerySchema, saveAnalysisSchema } from '../utils/validation.js';

const router = express.Router();

// Middleware to optionally authenticate
const optionalAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token || req.body.token;
    if (token) return authenticateToken(req, res, next);
    next();
};

router.post('/save', authenticateToken, validate(saveAnalysisSchema), saveAnalysis);
router.get('/history', optionalAuth, getHistory);
router.get('/metrics', getMetrics);
router.get('/analyze/stream', validate(analysisQuerySchema), streamAnalysis);

export default router;
