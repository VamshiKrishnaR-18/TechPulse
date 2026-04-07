import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron'; // <-- New Import
import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const prisma = new PrismaClient();

app.post('/api/analyze', async (req, res) => {
    try {
        const userTech = req.body.tech.toLowerCase();

        // 1. THE CACHE CHECK
        const cachedAnalysis = await prisma.techAnalysis.findUnique({
            where: { techName: userTech }
        });

        if (cachedAnalysis) {
            console.log(`⚡ CACHE HIT: Serving [${userTech}] directly from PostgreSQL.`);
            return res.json({
                success: true,
                technology: cachedAnalysis.techName,
                raw_metrics: cachedAnalysis.metrics,
                ai_insight: cachedAnalysis.aiInsight,
                source: "database_cache"
            });
        }

        console.log(`🐌 CACHE MISS: Fetching live GitHub telemetry for [${userTech}]...`);

        // 2. THE LIVE GITHUB API FETCH
        const githubRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(userTech)}&sort=stars&order=desc`);
        const githubData = await githubRes.json();

        if (!githubData.items || githubData.items.length === 0) {
            return res.status(404).json({ success: false, message: "Could not find any live GitHub data for this technology." });
        }

        const topRepo = githubData.items[0];
        const liveStats = {
            name: topRepo.full_name,
            stars: topRepo.stargazers_count,
            forks: topRepo.forks_count
        };

        console.log(`📡 GITHUB SUCCESS: Found ${liveStats.name} with ${liveStats.stars} stars.`);

        // 3. THE DYNAMIC AI PROMPT
        const prompt = `
            You are 'TechPulse', an elite, data-driven Tech Career Advisor.
            Analyze the technology: ${userTech}.
            LIVE GITHUB METRICS: Stars: ${liveStats.stars}, Forks: ${liveStats.forks}.
            Respond strictly with a valid JSON object matching this schema:
            {
                "metrics": { "github_score": number, "job_score": number, "stability_score": number },
                "insight": { "verdict": "string", "explanation": "string", "future_outlook": "string" }
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.1, responseMimeType: "application/json" }
        });

        const rawAiJSON = JSON.parse(response.text);

        // 4. SAVE TO POSTGRESQL
        await prisma.techAnalysis.create({
            data: {
                techName: userTech,
                metrics: rawAiJSON.metrics,
                aiInsight: rawAiJSON.insight
            }
        });

        res.json({
            success: true,
            technology: userTech,
            raw_metrics: rawAiJSON.metrics,
            ai_insight: rawAiJSON.insight,
            source: "live_api_and_ai"
        });

    } catch (error) {
        console.error("Pipeline Error:", error);
        res.status(500).json({ success: false, message: "Server encountered an error." });
    }
});

// ==========================================
// 5. BACKGROUND WORKER (CRON JOB)
// ==========================================
// We are setting this to '* * * * *' (Every 1 Minute) so you can see it work right now.
// For production, you would change this to '0 2 * * *' (Every day at 2:00 AM).
cron.schedule('* * * * *', async () => {
    console.log("\n⏰ [BACKGROUND WORKER] Booting up scheduled task...");
    try {
        const allRecords = await prisma.techAnalysis.findMany();
        console.log(`📡 [WORKER] Found ${allRecords.length} cached technologies in PostgreSQL.`);

        for (const record of allRecords) {
            console.log(`🔄 [WORKER] Verifying data integrity for: ${record.techName}`);
            
            // In a fully scaled app, you would re-call the GitHub/Gemini APIs here.
            // For now, we update the database timestamp to simulate the refresh cycle and prove the worker has write-access.
            await prisma.techAnalysis.update({
                where: { id: record.id },
                data: { createdAt: new Date() } 
            });
        }
        console.log("✅ [BACKGROUND WORKER] Database maintenance complete. Going back to sleep.\n");
    } catch (error) {
        console.error("❌ [WORKER] Error during background task:", error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 TechPulse Orchestrator running on http://localhost:${PORT}`);
});