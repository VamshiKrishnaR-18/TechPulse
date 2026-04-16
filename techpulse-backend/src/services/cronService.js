import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { fetchSentiment, getAIAnalysisStream } from './aiService.js';

export const initCronJobs = () => {
    // Run weekly: 0 0 * * 0 (Sunday at midnight)
    cron.schedule('0 0 * * 0', async () => {
        console.log("🚀 Starting Weekly Tech Analysis Refresh...");
        try {
            const allRecords = await prisma.techAnalysis.findMany();
            console.log(`Found ${allRecords.length} technologies to refresh.`);

            for (const record of allRecords) {
                const userTech = record.techName;
                console.log(`🔄 Refreshing [${userTech}]...`);

                try {
                    // 1. Fetch GitHub Data
                    const githubRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(userTech)}&sort=stars&order=desc`);
                    const githubData = await githubRes.json();
                    
                    if (!githubData.items?.length) {
                        console.warn(`⚠️ No GitHub data found for [${userTech}], skipping...`);
                        continue;
                    }

                    const topRepo = githubData.items[0];

                    // 2. Fetch Sentiment
                    const sentiment = await fetchSentiment(userTech);

                    // 3. Get AI Analysis Stream and collect full text
                    const completion = await getAIAnalysisStream(userTech, topRepo, sentiment);
                    let fullText = "";
                    for await (const chunk of completion) {
                        fullText += chunk.choices[0]?.delta?.content || "";
                    }

                    const rawAiJSON = JSON.parse(fullText);

                    // 4. Normalize metrics
                    const metrics = {
                        github_score: Math.min(100, rawAiJSON.metrics?.github_score || 0),
                        job_score: Math.min(100, rawAiJSON.metrics?.job_score || 0),
                        stability_score: Math.min(100, rawAiJSON.metrics?.stability_score || 0)
                    };

                    const finalAnalysis = {
                        verdict: rawAiJSON.insight.verdict,
                        explanation: rawAiJSON.insight.explanation,
                        future_outlook: rawAiJSON.insight.future_outlook,
                        sentiment_keywords: rawAiJSON.sentiment_keywords,
                        tech_stack: rawAiJSON.tech_stack,
                        roadmap: rawAiJSON.roadmap
                    };

                    // 5. Update Database Cache
                    await prisma.techAnalysis.update({
                        where: { id: record.id },
                        data: { 
                            metrics: metrics, 
                            aiInsight: finalAnalysis,
                            createdAt: new Date()
                        }
                    });

                    console.log(`✅ [${userTech}] refreshed successfully.`);
                } catch (innerError) {
                    console.error(`❌ Error refreshing [${userTech}]:`, innerError.message);
                }
            }
            console.log("🏁 Weekly Tech Analysis Refresh Complete.");
        } catch (error) { 
            console.error("Worker Error:", error.message); 
        }
    });
};
