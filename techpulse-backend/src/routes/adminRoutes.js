import express from 'express';
import { getPlatformStats } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js'; // Adjust name if yours is different
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// The route is protected by BOTH middlewares: Must be logged in AND an Admin
router.get('/stats', authenticateToken, requireAdmin, getPlatformStats);

export default router;