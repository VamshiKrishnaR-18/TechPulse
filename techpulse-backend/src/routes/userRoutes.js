import express from 'express';
import { updatePreferences, getPreferences, getPersonalInsight } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, updatePreferences);
router.post('/personal-insight', getPersonalInsight);

export default router;
