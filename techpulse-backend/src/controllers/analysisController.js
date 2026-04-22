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

        // 🛡️ Subjective Privacy: Guests should not see the global history
        return res.json({ 
            success: true, 
            history: [], 
            isGuest: true,
            meta: { total: 0, page, totalPages: 0 } 
        });
    } catch (e) {
        console.error("Get History Error:", e.message);
        res.status(500).json({ success: false, message: "Failed to fetch history." });
    }
};

export const getMetrics = async (req, res) => {
    try {
        const category = req.query.category || 'languages';
        
        const CATEGORY_MAP = {
            languages: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift'],
            frameworks: ['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Django', 'Spring Boot', 'Laravel'],
            frontend: ['React', 'Vue', 'Tailwind CSS', 'Vite', 'Webpack', 'Three.js', 'Framer Motion'],
            backend: ['Node.js', 'Express', 'FastAPI', 'Go', 'NestJS', 'Ruby on Rails', 'Elixir'],
            mobile: ['React Native', 'Flutter', 'SwiftUI', 'Kotlin', 'Ionic', 'Dart'],
            cloud: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Azure', 'Google Cloud', 'Nginx'],
            database: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Supabase', 'Firebase', 'Elasticsearch'],
            ai: ['PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'OpenCV', 'Hugging Face'],
            llm: ['OpenAI', 'LangChain', 'LlamaIndex', 'Groq', 'Anthropic', 'Mistral'],
            cybersecurity: ['Kali Linux', 'Wireshark', 'Metasploit', 'Burp Suite', 'Nmap'],
            web3: ['Solidity', 'Ethers.js', 'Hardhat', 'IPFS', 'The Graph', 'Web3.js'],
            domains: ['E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'PropTech', 'AdTech'],
            industry_trends: ['Remote Work', 'Serverless', 'Microservices', 'Low-code', 'No-code'],
        };

        const targetTechs = CATEGORY_MAP[category] || CATEGORY_MAP.languages;

        // Dynamic aggregate data from the global history (REAL reports)
        // We filter by the technologies that belong to this category
        const realReports = await prisma.techAnalysis.findMany({
            where: {
                techName: {
                    in: targetTechs,
                    mode: 'insensitive'
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
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
            fill: '#' + Math.floor(Math.random()*16777215).toString(16)
        }));

        // Generate seeded defaults based on the category if we don't have enough real data
        const getSeededDefaults = (cat) => {
            const techs = CATEGORY_MAP[cat] || CATEGORY_MAP.languages;
            return techs.slice(0, 5).map((name, i) => ({
                techName: name,
                score: 70 + Math.random() * 25,
                momentum: 5 + Math.random() * 15,
                demand: 60 + Math.random() * 35,
                sentiment: 75 + Math.random() * 20,
                sources: {
                    github: 70 + Math.random() * 20,
                    jobs: 60 + Math.random() * 30,
                    stability: 80 + Math.random() * 15
                },
                fill: ['#61dafb', '#dea584', '#3178c6', '#00add8', '#3776ab'][i] || '#ccc'
            }));
        };

        const finalTrends = dynamicTrends.length >= 3 ? dynamicTrends : getSeededDefaults(category);

        res.json({ 
            success: true, 
            trends: finalTrends,
            meta: {
                category,
                hasData: dynamicTrends.length >= 3,
                dataSource: dynamicTrends.length >= 3 ? "Live Analysis Database" : "Seeded Market Defaults"
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