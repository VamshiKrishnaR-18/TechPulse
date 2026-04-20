import prisma from '../config/prisma.js';
import { fetchMixedFeed } from '../services/newsService.js';
import { getAISummarization, getAISearchSuggestion } from '../services/aiService.js';
import { AISummarySchema, AISearchSuggestionSchema } from '../utils/aiValidation.js';

export const getFeed = async (req, res) => {
    try {
        const query = typeof req.query.q === 'string' ? req.query.q : '';
        const tab = typeof req.query.tab === 'string' ? req.query.tab : 'For You';
        const userId = req.user?.userId;

        let followedTechs = [];
        if (userId && tab === 'For You') {
            const follows = await prisma.follow.findMany({
                where: { userId },
                select: { techName: true }
            });
            followedTechs = follows.map(f => f.techName);
        }

        const feed = await fetchMixedFeed({ query, tab, followedTechs });
        res.json({ success: true, feed });
    } catch (error) {
        console.error("Feed Aggregator Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch news feed." });
    }
};

export const summarizeArticle = async (req, res) => {
    const { title, description } = req.body;
    try {
        const result = await getAISummarization(title, description);
        
        // Validate AI response structure
        const validated = AISummarySchema.safeParse(result);
        if (!validated.success) {
            console.warn("⚠️ AI Summarization validation failed:", validated.error.message);
            // We can choose to fallback or still return partial data if it's usable
            // But for robustness, let's return the raw result if it's at least an object
            // or throw error if it's totally broken.
        }

        const data = validated.success ? validated.data : result;
        
        let techMetrics = null;
        if (data.main_tech && data.main_tech.toLowerCase() !== "unknown") {
            try {
                const cached = await prisma.techAnalysis.findUnique({
                    where: { techName: data.main_tech.toLowerCase() }
                });
                if (cached) techMetrics = cached.metrics;
            } catch (e) { console.error("Summarizer Metrics Cache Error:", e.message); }
        }

        res.json({ success: true, ...data, techMetrics });
    } catch (error) {
        console.error("Summarizer Error:", error.message);
        res.status(500).json({ success: false, message: "AI Summarization failed." });
    }
};

export const saveArticle = async (req, res) => {
    const { title, url, source, image } = req.body;
    const userId = req.user.userId;
    try {
        await prisma.savedArticle.create({
            data: { userId, title, url, source, image }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, message: "Save article failed." });
    }
};

export const getSavedArticles = async (req, res) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const [articles, total] = await Promise.all([
            prisma.savedArticle.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.savedArticle.count({ where: { userId } })
        ]);

        res.json({ 
            success: true, 
            articles,
            meta: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to fetch saved articles." });
    }
};

export const suggestSearch = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json({ success: true, suggestedQuery: '' });
    try {
        const result = await getAISearchSuggestion(query);
        const validated = AISearchSuggestionSchema.safeParse(result);
        res.json({ success: true, ...(validated.success ? validated.data : result) });
    } catch (error) {
        console.error("Search Suggestion Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to get suggestion." });
    }
};
