import express from 'express';
import { getPlatformStats, invalidateCache, getSystemLogs } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform-wide statistics
 */
router.get("/stats", getPlatformStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users
 */
router.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, createdAt: true }
        });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch users." });
    }
});

/**
 * @route   DELETE /api/admin/cache/:techName
 * @desc    Manually purge a specific technology from the cache
 */
router.delete("/cache/:techName", invalidateCache);

/**
 * @route   GET /api/admin/logs
 * @desc    Fetch the latest system logs (ADMIN only)
 */
router.get("/logs", getSystemLogs);

export default router;