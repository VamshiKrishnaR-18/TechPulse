import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { fetchSentiment, getAIAnalysisStream } from './aiService.js';
import { AIAnalysisSchema, safeParseAIJSON } from '../utils/aiValidation.js';
import logger from '../config/logger.js';

export const initCronJobs = () => {
    // 1. Weekly Tech Analysis Refresh (Sunday at midnight)
    cron.schedule('0 0 * * 0', async () => {
        logger.info("🚀 Starting Weekly Tech Analysis Refresh...");
        try {
            const allRecords = await prisma.techAnalysis.findMany();
            for (const record of allRecords) {
                const userTech = record.techName;
                try {
                    const githubRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(userTech)}&sort=stars&order=desc`, {
                        headers: { 'User-Agent': 'TechPulse/1.0.0' }
                    });
                    if (!githubRes.ok) {
                        logger.warn(`❌ GitHub API Error [${githubRes.status}] for [${userTech}]`);
                        continue;
                    }
                    const githubData = await githubRes.json();
                    if (!githubData?.items?.length) continue;
                    const topRepo = githubData.items[0];

                    const sentiment = await fetchSentiment(userTech);
                    const completion = await getAIAnalysisStream(userTech, topRepo, sentiment);
                    
                    let fullText = "";
                    for await (const chunk of completion) {
                        fullText += chunk.choices[0]?.delta?.content || "";
                    }

                    const rawAiJSON = safeParseAIJSON(fullText);
                    if (!rawAiJSON) continue;

                    const validated = AIAnalysisSchema.safeParse(rawAiJSON);
                    const data = validated.success ? validated.data : rawAiJSON;

                    await prisma.techAnalysis.update({
                        where: { id: record.id },
                        data: { 
                            metrics: {
                                github_score: Math.min(100, data.metrics?.github_score || 0),
                                job_score: Math.min(100, data.metrics?.job_score || 0),
                                stability_score: Math.min(100, data.metrics?.stability_score || 0)
                            }, 
                            aiInsight: {
                                verdict: data.insight?.verdict || "Analysis Complete",
                                explanation: data.insight?.explanation || "Strategic report generated.",
                                future_outlook: data.insight?.future_outlook || "Stable market presence.",
                                sentiment_keywords: data.sentiment_keywords || [],
                                tech_stack: data.tech_stack || [],
                                roadmap: data.roadmap || []
                            },
                            createdAt: new Date()
                        }
                    });
                    logger.info(`✅ [${userTech}] refreshed.`);
                } catch (innerError) {
                    logger.error(`❌ Error refreshing [${userTech}]: ${innerError.message}`);
                }
            }
            logger.info("🏁 Weekly Refresh Complete.");
        } catch (error) { 
            logger.error(`Worker Error: ${error.message}`); 
        }
    });

    // 2. DAILY CACHE CLEANUP (Run every day at 3 AM)
    // Deletes articles older than 3 days to prevent DB overload
    cron.schedule('0 3 * * *', async () => {
        logger.info("🧹 Starting Daily News Cache Cleanup...");
        try {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const deleted = await prisma.newsCache.deleteMany({
                where: {
                    createdAt: {
                        lt: threeDaysAgo
                    }
                }
            });
            logger.info(`✅ Cleanup Complete: Purged ${deleted.count} old articles.`);
        } catch (error) {
            logger.error(`Cleanup Worker Error: ${error.message}`);
        }
    });
};
