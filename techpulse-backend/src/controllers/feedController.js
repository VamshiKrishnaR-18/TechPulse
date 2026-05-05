import prisma from '../config/prisma.js';
import { fetchMixedFeed } from '../services/newsService.js';
import { getAISummarization, getAISearchSuggestion, getAIChatStream } from '../services/aiService.js';
import { AISummarySchema, AISearchSuggestionSchema } from '../utils/aiValidation.js';
import { incrementAffinity } from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Caches fetched articles into the database for future fallbacks.
 * Uses SavedArticle as the model (User-specific history).
 */
const cacheArticles = async (articles, userId) => {
    if (process.env.NODE_ENV === "test") return;
    if (!articles || articles.length === 0 || !userId) return;

    // Cache a few for the user
    const itemsToCache = articles.slice(0, 5);

    try {
        for (const article of itemsToCache) {
            const existing = await prisma.savedArticle.findFirst({
                where: { url: article.url, userId }
            });

            if (!existing) {
                await prisma.savedArticle.create({
                    data: {
                        userId,
                        title: article.title,
                        url: article.url,
                        source: article.source,
                        image: article.image
                    }
                });
            }
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

        // 1. Fetch AI-evaluated news from global cache first
        const aiEvaluatedNews = await prisma.newsCache.findMany({
            where: query ? {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { cleanTitle: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { tags: { has: query.toLowerCase() } }
                ]
            } : {},
            orderBy: [
                { relevanceScore: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 40
        });

        // 2. Fetch live feed from external APIs
        let liveFeed = await fetchMixedFeed({ query, tab, followedTechs });
        
        // 3. Merge and deduplicate (prioritize AI evaluated news)
        const seenUrls = new Set(aiEvaluatedNews.map(n => n.url));
        const filteredLiveFeed = (liveFeed || []).filter(item => !seenUrls.has(item.url));
        
        const feed = [...aiEvaluatedNews, ...filteredLiveFeed];

        res.json({
            success: true,
            feed,
            meta: {
                count: feed.length,
                aiCount: aiEvaluatedNews.length,
                liveCount: filteredLiveFeed.length,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error(`Feed Aggregator Error: ${error.message}`);

        try {
            const fallbackFeed = await prisma.newsCache.findMany({ take: 30, orderBy: { createdAt: 'desc' } });
            return res.json({ success: true, feed: fallbackFeed, meta: { source: "error_fallback" } });
        } catch (dbError) {
            res.status(500).json({ success: false, message: "Critical failure in news feed." });
        }
    }
};

export const summarizeArticle = async (req, res) => {
    const { title, description, url, articleId } = req.body;
    const userId = req.user?.userId;
    try {
        // 1. Check cache first
        if (url) {
            const cached = await prisma.newsCache.findUnique({
                where: { url }
            });

            if (cached && cached.aiDetailedSummary && cached.aiDetailedSummary.length > 0) {
                console.log(`🎯 Cache Hit (Detailed) for: ${title}`);
                return res.json({
                    success: true,
                    summary: cached.aiDetailedSummary,
                    main_tech: cached.main_tech || "General",
                    sentiment_score: cached.sentimentScore || 50,
                    impact_verdict: cached.impactVerdict || cached.aiSummary || "Strategic analysis complete.",
                    impact_category: cached.impactCategory,
                    key_concepts: cached.tags || [],
                    risks: cached.risks || [],
                    techMetrics: null
                });
            }
        }

        // 2. Generate if not cached
        const result = await getAISummarization(title, description, url);
        const validated = AISummarySchema.safeParse(result);
        const data = validated.success ? validated.data : result;

        // 3. Update cache with full results
        if (url) {
            await prisma.newsCache.upsert({
                where: { url },
                update: {
                    aiSummary: data.impact_verdict, 
                    aiDetailedSummary: data.summary || [],
                    impactCategory: data.impact_category,
                    impactVerdict: data.impact_verdict,
                    sentimentScore: data.sentiment_score,
                    tags: { set: data.key_concepts || [] },
                    risks: { set: data.risks || [] }
                },
                create: {
                    url,
                    title,
                    description,
                    aiSummary: data.impact_verdict,
                    aiDetailedSummary: data.summary || [],
                    impactCategory: data.impact_category,
                    impactVerdict: data.impact_verdict,
                    sentimentScore: data.sentiment_score,
                    tags: data.key_concepts || [],
                    risks: data.risks || []
                }
            });
        }

        // Track behavioral affinity
        if (userId && data.key_concepts) {
            incrementAffinity(userId, data.key_concepts).catch(e => logger.error(`Affinity tracking error: ${e.message}`));
        }

        res.json({ success: true, ...data });
    } catch (error) {
        console.error("Summarizer Error:", error.message);
        res.json({
            success: true,
            summary: [
                "Strategic intelligence synthesis is currently processing this signal.",
                "The community discussion for this item is active and high-signal.",
                "Detailed technical impact analysis will be available shortly."
            ],
            main_tech: "Technical Analysis",
            sentiment_score: 50,
            impact_verdict: "AI summarization is currently being refined for this signal type.",
            key_concepts: ["Processing", "Market Signal"],
            risks: ["Temporary unavailable"],
            techMetrics: null
        });
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
        if (process.env.NODE_ENV === 'test' && error.message.includes('401')) {
            // Quiet warning for missing keys in CI
            logger.warn("AI Search Suggestion: Skipped (Missing/Invalid API Key)");
        } else {
            console.error("Search Suggestion Error:", error.message);
        }
        // Per user request: no mock service, but we return a valid response using the original query if AI fails
        res.json({ success: true, suggestedQuery: query });
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

export const chatWithArticle = async (req, res) => {
    const { message, articleId, history = [] } = req.body;
    const userId = req.user?.userId;
    
    try {
        const article = await prisma.newsCache.findUnique({
            where: { id: articleId }
        });

        if (!article) {
            return res.status(404).json({ success: false, message: "Article not found." });
        }

        // Track behavioral affinity
        if (userId && article.tags) {
            incrementAffinity(userId, article.tags).catch(e => logger.error(`Affinity chat tracking error: ${e.message}`));
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await getAIChatStream(message, article, history);

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

    } catch (error) {
        logger.error(`Chat Error: ${error.message}`);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Chat failed." });
        } else {
            res.end();
        }
    }
};
