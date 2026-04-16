import express from 'express';
import authRoutes from './authRoutes.js';
import feedRoutes from './feedRoutes.js';
import analysisRoutes from './analysisRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

router.use('/api', authRoutes);
router.use('/api', feedRoutes);
router.use('/api', analysisRoutes);
router.use('/api/admin', adminRoutes);

export default router;
