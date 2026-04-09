import express from 'express';
import { getFeed, summarizeArticle, saveArticle, getSavedArticles, suggestSearch } from '../controllers/feedController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { summarizeSchema, saveArticleSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/feed', getFeed);
router.get('/suggest-search', suggestSearch);
router.post('/summarize', validate(summarizeSchema), summarizeArticle);
router.post('/save-article', authenticateToken, validate(saveArticleSchema), saveArticle);
router.get('/saved-articles', authenticateToken, getSavedArticles);

export default router;
