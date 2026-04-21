import prisma from '../config/prisma.js';
import { fetchSentiment, getAIAnalysisStream } from '../services/aiService.js';
import { AIAnalysisSchema, safeParseAIJSON } from '../utils/aiValidation.js';

export const saveAnalysis = async (req, res) => {
    const { techName } = req.body;
    const userId = req.user.userId;
    try {
        await prisma.savedAnalysis.create({
            data: { userId, techName }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, message: "Unauthorized." });
    }
};

export const getHistory = async (req, res) => {
    try {
        // 1. Extract pagination values (default to page 1, 10 items)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const userId = req.user?.userId;
        
        if (userId) {
            const history = await prisma.savedAnalysis.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            });
            
            // Count total for the frontend
            const total = await prisma.savedAnalysis.count({
                where: { userId }
            });

            return res.json({ 
                success: true, 
                history, 
                meta: { total, page, totalPages: Math.ceil(total / limit) } 
            });
        }
        throw new Error("No user");
    } catch (e) {
        // Fallback for Guests (also paginated now)
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const [globalHistory, total] = await Promise.all([
                prisma.techAnalysis.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: skip
                }),
                prisma.techAnalysis.count()
            ]);
            
            res.json({ 
                success: true, 
                history: globalHistory, 
                isGuest: true,
                meta: { total, page, totalPages: Math.ceil(total / limit) } 
            });
        } catch (dbError) {
            console.error("Guest History DB Error:", dbError.message);
            res.json({ success: true, history: [], isGuest: true, error: "Database offline" });
        }
    }
};

export const getMetrics = async (req, res) => {
    try {
        const category = req.query.category || 'languages';
        
        // Dynamic aggregate data from the global history (REAL reports)
        const realReports = await prisma.techAnalysis.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Filter and map real reports to the expected trend format
        const dynamicTrends = realReports.map(report => ({
            techName: report.techName,
            score: (report.metrics.github_score + report.metrics.job_score + report.metrics.stability_score) / 3,
            sources: {
                github: report.metrics.github_score,
                jobs: report.metrics.job_score,
                stability: report.metrics.stability_score
            },
            fill: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color for now
        }));

        // If we have no real data, we return empty
        res.json({ 
            success: true, 
            trends: dynamicTrends,
            meta: {
                hasData: dynamicTrends.length > 0,
                dataSource: dynamicTrends.length > 0 ? "Live Analysis Database" : "No analyzed data found"
            }
        });
    } catch (error) {
        console.error("Get Metrics Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch metrics." });
    }
};

export const toggleFollow = async (req, res) => {
    const { techName } = req.body;
    const userId = req.user.userId;
    const normalizedTech = techName.toLowerCase();

    try {
        const existing = await prisma.follow.findUnique({
            where: {
                userId_techName: { userId, techName: normalizedTech }
            }
        });

        if (existing) {
            await prisma.follow.delete({
                where: { id: existing.id }
            });
            return res.json({ success: true, followed: false });
        } else {
            await prisma.follow.create({
                data: { userId, techName: normalizedTech }
            });
            return res.json({ success: true, followed: true });
        }
    } catch (e) {
        console.error("Toggle Follow Error:", e.message);
        res.status(500).json({ success: false, message: "Failed to update following list." });
    }
};

export const getFollowedTechs = async (req, res) => {
    const userId = req.user.userId;
    try {
        const followed = await prisma.follow.findMany({
            where: { userId },
            select: { techName: true }
        });
        res.json({ success: true, followed: followed.map(f => f.techName) });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to fetch following list." });
    }
};

export const getCachedTechNames = async (req, res) => {
    try {
        const techs = await prisma.techAnalysis.findMany({
            select: { techName: true }
        });
        res.json({ success: true, techNames: techs.map(t => t.techName) });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to fetch cached technologies." });
    }
};

export const clearHistory = async (req, res) => {
    const userId = req.user.userId;
    try {
        await prisma.savedAnalysis.deleteMany({
            where: { userId }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ success: false, message: "Clear history failed." });
    }
};

export const streamAnalysis = async (req, res) => {
    const userTech = req.query.tech?.toLowerCase();
    if (!userTech) return res.status(400).json({ success: false, message: "Tech name required." });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
        const cached = await prisma.techAnalysis.findUnique({ where: { techName: userTech } });
        if (cached) {
            sendEvent({ success: true, technology: userTech, raw_metrics: cached.metrics, ai_insight: cached.aiInsight, source: "database_cache", done: true });
            return res.end();
        }

        const githubUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(userTech)}&sort=stars&order=desc`;
        const githubRes = await fetch(githubUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!githubRes.ok) {
            logger.warn(`❌ GitHub Analysis API Error [${githubRes.status}] for ${githubUrl}`);
            sendEvent({ success: false, message: "GitHub data currently unavailable." });
            return res.end();
        }

        const text = await githubRes.text();
        let githubData;
        try {
            githubData = JSON.parse(text);
        } catch (e) {
            logger.error(`❌ GitHub Analysis JSON Parse Error: ${e.message}. Snippet: ${text.slice(0, 100)}`);
            sendEvent({ success: false, message: "Failed to parse repository data." });
            return res.end();
        }

        if (!githubData.items?.length) {
            sendEvent({ success: false, message: "No GitHub data found." });
            return res.end();
        }

        const topRepo = githubData.items[0];
        const sentiment = await fetchSentiment(userTech);

        sendEvent({ success: true, technology: userTech, raw_metrics: { github_score: 0, job_score: 0, stability_score: 0 }, status: "analyzing" });

        const completion = await getAIAnalysisStream(userTech, topRepo, sentiment);

        let fullText = "";
        for await (const chunk of completion) {
            const chunkText = chunk.choices[0]?.delta?.content || "";
            fullText += chunkText;
            if (chunkText) sendEvent({ success: true, status: "streaming", chunk: chunkText });
        }

        const rawAiJSON = safeParseAIJSON(fullText);
        if (!rawAiJSON) throw new Error("AI returned malformed data.");

        const validated = AIAnalysisSchema.safeParse(rawAiJSON);
        if (!validated.success) {
            console.warn("⚠️ AI Analysis validation failed:", validated.error.message);
        }

        const data = validated.success ? validated.data : rawAiJSON;
        
        // Ensure metrics are valid and normalized
        const metrics = {
            github_score: Math.min(100, data.metrics?.github_score || 0),
            job_score: Math.min(100, data.metrics?.job_score || 0),
            stability_score: Math.min(100, data.metrics?.stability_score || 0)
        };

        const finalAnalysis = {
            verdict: data.insight?.verdict || "Analysis Complete",
            explanation: data.insight?.explanation || "Strategic report generated.",
            future_outlook: data.insight?.future_outlook || "Stable market presence.",
            sentiment_keywords: data.sentiment_keywords || [],
            tech_stack: data.tech_stack || [],
            roadmap: data.roadmap || []
        };

        await prisma.techAnalysis.upsert({
            where: { techName: userTech },
            update: { metrics: metrics, aiInsight: finalAnalysis },
            create: { techName: userTech, metrics: metrics, aiInsight: finalAnalysis }
        });

        sendEvent({ success: true, technology: userTech, raw_metrics: metrics, ai_insight: finalAnalysis, source: "live_api_and_ai", done: true });
        res.end();

    } catch (error) {
        console.error("SSE Error:", error.message);
        try {
            const lastKnown = await prisma.techAnalysis.findUnique({ where: { techName: userTech } });
            if (lastKnown) {
                sendEvent({ success: true, technology: userTech, raw_metrics: lastKnown.metrics, ai_insight: lastKnown.aiInsight, source: "fallback", done: true });
                return res.end();
            }
        } catch (e) {}
        sendEvent({ success: false, message: "Analysis failed." });
        res.end();
    }
};