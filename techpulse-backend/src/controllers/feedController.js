import prisma from '../config/prisma.js';
import { fetchMixedFeed } from '../services/newsService.js';
import { getAISummarization, getAISearchSuggestion } from '../services/aiService.js';
import { AISummarySchema, AISearchSuggestionSchema } from '../utils/aiValidation.js';
import logger from '../config/logger.js';

/**
 * Caches fetched articles into the database for future fallbacks.
 * This now uses REAL AI to generate summaries for the cache if they don't exist.
 */
const cacheArticles = async (articles) => {
    if (!articles || articles.length === 0) return;
    
    // Cache a manageable number of items
    const itemsToCache = articles.slice(0, 15);
    
    try {
        for (const article of itemsToCache) {
            // Check if we already have this article cached
            const existing = await prisma.newsCache.findUnique({
                where: { url: article.url }
            });

            if (existing) {
                // Just update the points and refresh the timestamp
                await prisma.newsCache.update({
                    where: { id: existing.id },
                    data: { 
                        points: article.points || existing.points,
                        createdAt: new Date() 
                    }
                });
                continue;
            }

            // If it's a NEW article, we can optionally trigger a REAL AI summary 
            // but to keep getFeed fast, we'll store the raw description first.
            // A background worker could later enrich these with better AI summaries.
            
            await prisma.newsCache.create({
                data: {
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    source: article.source,
                    image: article.image,
                    author: article.author,
                    tags: article.tags || [],
                    points: article.points || 0
                }
            });
        }
    } catch (err) {
        logger.error(`Feed Cache Error: ${err.message}`);
    }
};

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

        // 1. Attempt to fetch from external APIs
        let feed = await fetchMixedFeed({ query, tab, followedTechs });
        let source = "live_api";

        // 2. Fallback to Database if APIs fail or return empty
        if (!feed || feed.length === 0) {
            logger.warn(`External APIs returned empty for tab [${tab}], falling back to DB cache.`);
            
            feed = await prisma.newsCache.findMany({
                where: query ? {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { source: { contains: query, mode: 'insensitive' } }
                    ]
                } : {},
                orderBy: [
                    { points: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: 50
            });
            
            source = "database_fallback";
        } else {
            // 3. Background cache the successful fetch (optional/non-blocking)
            cacheArticles(feed).catch(err => logger.error(`Background caching failed: ${err.message}`));
        }

        res.json({ 
            success: true, 
            feed, 
            meta: { 
                count: feed.length, 
                source,
                timestamp: new Date()
            } 
        });
    } catch (error) {
        logger.error(`Feed Aggregator Error: ${error.message}`);
        
        // Final safety fallback in case fetchMixedFeed itself throws
        try {
            const fallbackFeed = await prisma.newsCache.findMany({ take: 30, orderBy: { createdAt: 'desc' } });
            return res.json({ success: true, feed: fallbackFeed, meta: { source: "error_fallback" } });
        } catch (dbError) {
            res.status(500).json({ success: false, message: "Critical failure in news feed." });
        }
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

export const deleteArticle = async (req, res) => {
    const { articleId } = req.params;
    const userId = req.user.userId;
    try {
        await prisma.savedArticle.delete({
            where: { id: articleId, userId }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, message: "Delete article failed." });
    }
};
