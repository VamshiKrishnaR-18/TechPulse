import prisma from '../config/prisma.js';
import { fetchMixedFeed } from '../services/newsService.js';
import { getAISummarization, getAISearchSuggestion } from '../services/aiService.js';

export const getFeed = async (req, res) => {
    try {
        const query = typeof req.query.q === 'string' ? req.query.q : '';
        const tab = typeof req.query.tab === 'string' ? req.query.tab : 'For You';
        const feed = await fetchMixedFeed({ query, tab });
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
        
        let techMetrics = null;
        if (result.main_tech && result.main_tech.toLowerCase() !== "unknown") {
            try {
                const cached = await prisma.techAnalysis.findUnique({
                    where: { techName: result.main_tech.toLowerCase() }
                });
                if (cached) techMetrics = cached.metrics;
            } catch (e) { console.error("Summarizer Metrics Cache Error:", e.message); }
        }

        res.json({ success: true, ...result, techMetrics });
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
    try {
        const articles = await prisma.savedArticle.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, articles });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to fetch saved articles." });
    }
};

export const suggestSearch = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json({ success: true, suggestedQuery: '' });
    try {
        const result = await getAISearchSuggestion(query);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Search Suggestion Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to get suggestion." });
    }
};
