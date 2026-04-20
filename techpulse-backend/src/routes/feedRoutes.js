import express from 'express';
import { getFeed, summarizeArticle, saveArticle, getSavedArticles, suggestSearch } from '../controllers/feedController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { summarizeSchema, saveArticleSchema } from '../utils/validation.js';

const router = express.Router();

// Middleware to optionally authenticate
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) return authenticateToken(req, res, next);
    next();
};

router.get('/feed', optionalAuth, getFeed);
router.get('/suggest-search', suggestSearch);
router.post('/summarize', validate(summarizeSchema), summarizeArticle);
router.post('/save-article', authenticateToken, validate(saveArticleSchema), saveArticle);
router.get('/saved-articles', authenticateToken, getSavedArticles);

export default router;
