import prisma from '../config/prisma.js';

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