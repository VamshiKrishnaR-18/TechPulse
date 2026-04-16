import prisma from '../config/prisma.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPlatformStats = async (req, res) => {
    try {
        // Run these queries in parallel for maximum speed
        const [totalUsers, totalAnalyses, totalSavedArticles] = await Promise.all([
            prisma.user.count(),
            prisma.techAnalysis.count(),
            prisma.savedArticle.count()
        ]);

        // Get the 5 most recent users who joined
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, role: true, createdAt: true } // Never send passwords!
        });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalAnalyses,
                totalSavedArticles
            },
            recentUsers
        });
    } catch (error) {
        console.error("Admin Stats Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch platform stats." });
    }
};

export const invalidateCache = async (req, res) => {
    const { techName } = req.params;
    try {
        const deleted = await prisma.techAnalysis.delete({
            where: { techName: techName.toLowerCase() }
        });
        
        console.log(`🗑️ Admin Cache Purge: [${techName}] removed by admin.`);
        
        res.json({ 
            success: true, 
            message: `Cache for [${techName}] has been purged successfully.`,
            deleted
        });
    } catch (error) {
        if (error.code === 'P2025') { // Prisma record not found error code
            return res.status(404).json({ success: false, message: `No cache found for [${techName}].` });
        }
        console.error("Cache Invalidation Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to invalidate cache." });
    }
};

export const getSystemLogs = async (req, res) => {
    const { type = 'combined' } = req.query;
    const logFile = type === 'error' ? 'error.log' : 'combined.log';
    
    // Resolve path to the logs directory at the root of techpulse-backend
    // Current file is in src/controllers, so go up two levels to reach root
    const logPath = path.resolve(__dirname, '../../logs', logFile);

    try {
        const data = await readFile(logPath, 'utf8');
        
        // Split by newlines and filter out empty strings
        const lines = data.split('\n').filter(line => line.trim() !== '');
        
        // Return only the last 100 lines
        const last100Lines = lines.slice(-100).join('\n');
        
        res.json({
            success: true,
            logs: last100Lines || "No logs available."
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.json({ success: true, logs: "Log file does not exist yet." });
        }
        console.error("Log Retrieval Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve logs." });
    }
};