import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || "techpulse_secret";
const prisma = new PrismaClient();
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

// --- HELPER: Exponential Backoff Retry ---
const withRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRateLimit = error.status === 429 || (error.message && error.message.includes("429"));
            if (!isRateLimit || i === maxRetries - 1) throw error;
            
            const delay = initialDelay * Math.pow(2, i);
            console.log(`⚠️ Rate limited (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw lastError;
};

// --- HELPER: Sentiment Scraper (RAG) ---
const fetchSentiment = async (tech) => {
    try {
        console.log(`🔍 Scraping developer sentiment for [${tech}]...`);
        const hnRes = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(tech)}&tags=comment&hitsPerPage=3`);
        const hnData = await hnRes.json();
        
        return hnData.hits.map(hit => ({
            text: hit.comment_text.replace(/<[^>]*>/g, '').slice(0, 300),
            source: "HackerNews",
            author: hit.author
        }));
    } catch (error) {
        console.error("Sentiment Scraping Failed:", error.message);
        return [];
    }
};

// --- ENDPOINT: News Feed Aggregator ---
app.get('/api/feed', async (req, res) => {
    try {
        const [devToRes, hnRes] = await Promise.all([
            fetch('https://dev.to/api/articles?per_page=12&top=7'),
            fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12')
        ]);

        const devToData = await devToRes.json();
        const hnData = await hnRes.json();

        const devToPosts = devToData.map(post => ({
            id: `devto-${post.id}`,
            title: post.title,
            description: post.description,
            url: post.url,
            image: post.cover_image || post.social_image,
            source: "Dev.to",
            author: post.user.name,
            tags: post.tag_list,
            createdAt: post.published_at,
            points: post.public_reactions_count || 0
        }));

        const hnPosts = hnData.hits.map(hit => ({
            id: `hn-${hit.objectID}`,
            title: hit.title,
            description: `Discussion on HackerNews with ${hit.num_comments} comments.`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            image: null,
            source: "HackerNews",
            author: hit.author,
            tags: ["news", "trending"],
            createdAt: hit.created_at,
            points: hit.points || 0
        }));

        const mixedFeed = [...devToPosts, ...hnPosts].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({ success: true, feed: mixedFeed });
    } catch (error) {
        console.error("Feed Aggregator Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch news feed." });
    }
});

// --- ENDPOINT: AI Summarizer ---
app.post('/api/summarize', async (req, res) => {
    const { title, description } = req.body;
    try {
        const prompt = `
            Analyze this tech news item:
            Title: ${title}
            Context: ${description}
            
            1. Summarize what is happening in 3 concise bullet points.
            2. Identify the main technology or tool being discussed (e.g., "React", "Rust", "OpenAI").
            3. Provide a 'Sentiment' score (0-100) based on the news.
            
            Respond strictly with a valid JSON object matching this schema:
            {
                "summary": ["string", "string", "string"],
                "main_tech": "string",
                "sentiment_score": number,
                "impact_verdict": "string"
            }
        `;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        
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
});

// --- ENDPOINT: Auth ---
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword }
        });
        const token = jwt.sign({ userId: user.id }, SECRET_KEY);
        res.json({ success: true, token, user: { email: user.email } });
    } catch (e) {
        res.status(400).json({ success: false, message: "User already exists or signup failed." });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user.id }, SECRET_KEY);
            res.json({ success: true, token, user: { email: user.email } });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials." });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: "Login failed." });
    }
});

// --- ENDPOINT: Saved Content ---
app.post('/api/save-article', async (req, res) => {
    const { title, url, source, image, token } = req.body;
    try {
        const { userId } = jwt.verify(token, SECRET_KEY);
        await prisma.savedArticle.create({
            data: { userId, title, url, source, image }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(401).json({ success: false, message: "Unauthorized or save failed." });
    }
});

app.get('/api/saved-articles', async (req, res) => {
    const { token } = req.query;
    try {
        const { userId } = jwt.verify(token, SECRET_KEY);
        const articles = await prisma.savedArticle.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, articles });
    } catch (e) {
        res.status(401).json({ success: false, message: "Unauthorized." });
    }
});

app.post('/api/save', async (req, res) => {
    const { techName, token } = req.body;
    try {
        const { userId } = jwt.verify(token, SECRET_KEY);
        await prisma.savedAnalysis.create({
            data: { userId, techName }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(401).json({ success: false, message: "Unauthorized." });
    }
});

app.get('/api/history', async (req, res) => {
    const { token } = req.query;
    try {
        const { userId } = jwt.verify(token, SECRET_KEY);
        const history = await prisma.savedAnalysis.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json({ success: true, history });
    } catch (e) {
        // Fallback for Guests
        try {
            const globalHistory = await prisma.techAnalysis.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            res.json({ success: true, history: globalHistory, isGuest: true });
        } catch (dbError) {
            console.error("Guest History DB Error:", dbError.message);
            res.json({ success: true, history: [], isGuest: true, error: "Database offline" });
        }
    }
});

// --- ENDPOINT: Tech Metrics (Global) ---
app.get('/api/metrics', async (req, res) => {
    try {
        const counts = await prisma.techAnalysis.findMany({
            select: { techName: true, metrics: true },
            take: 5
        });
        res.json({ success: true, trends: counts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch metrics." });
    }
});

// --- ENDPOINT: Real-Time Tech Analysis (SSE Streaming) ---
app.get('/api/analyze/stream', async (req, res) => {
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

        const githubRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(userTech)}&sort=stars&order=desc`);
        const githubData = await githubRes.json();
        if (!githubData.items?.length) {
            sendEvent({ success: false, message: "No GitHub data found." });
            return res.end();
        }

        const topRepo = githubData.items[0];
        const sentiment = await fetchSentiment(userTech);

        sendEvent({ success: true, technology: userTech, raw_metrics: { github_score: 0, job_score: 0, stability_score: 0 }, status: "analyzing" });

        const prompt = `
            Analyze ${userTech}. GitHub: Stars ${topRepo.stargazers_count}, Forks ${topRepo.forks_count}.
            SENTIMENT (RAG): ${sentiment.map(s => s.text).join('\n')}
            Respond strictly with a valid JSON object:
            {
                "metrics": { "github_score": number, "job_score": number, "stability_score": number },
                "insight": { "verdict": "string", "explanation": "string", "future_outlook": "string" },
                "sentiment_keywords": ["string", "string", "string"],
                "tech_stack": [{ "name": "string", "role": "string", "reason": "string" }],
                "roadmap": [{ "week": number, "topic": "string", "description": "string" }]
            }
        `;

        const completion = await withRetry(async () => {
            return await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: "You are TechPulse Advisor." }, { role: "user", content: prompt }],
                temperature: 0.1,
                stream: true,
                response_format: { type: "json_object" }
            });
        });

        let fullText = "";
        for await (const chunk of completion) {
            const chunkText = chunk.choices[0]?.delta?.content || "";
            fullText += chunkText;
            if (chunkText) sendEvent({ success: true, status: "streaming", chunk: chunkText });
        }

        const rawAiJSON = JSON.parse(fullText);
        const finalAnalysis = {
            verdict: rawAiJSON.insight.verdict,
            explanation: rawAiJSON.insight.explanation,
            future_outlook: rawAiJSON.insight.future_outlook,
            sentiment_keywords: rawAiJSON.sentiment_keywords,
            tech_stack: rawAiJSON.tech_stack,
            roadmap: rawAiJSON.roadmap
        };

        await prisma.techAnalysis.upsert({
            where: { techName: userTech },
            update: { metrics: rawAiJSON.metrics, aiInsight: finalAnalysis },
            create: { techName: userTech, metrics: rawAiJSON.metrics, aiInsight: finalAnalysis }
        });

        sendEvent({ success: true, technology: userTech, raw_metrics: rawAiJSON.metrics, ai_insight: finalAnalysis, source: "live_api_and_ai", done: true });
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
});

// --- BACKGROUND: Cron Job ---
cron.schedule('* * * * *', async () => {
    try {
        const allRecords = await prisma.techAnalysis.findMany();
        for (const record of allRecords) {
            await prisma.techAnalysis.update({ where: { id: record.id }, data: { createdAt: new Date() } });
        }
    } catch (error) { console.error("Worker Error:", error.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TechPulse Orchestrator running on http://localhost:${PORT}`));
