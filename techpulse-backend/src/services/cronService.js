import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { fetchSentiment, getAIAnalysisStream, evaluateArticle, getAISummarization } from './aiService.js';
import { fetchRSSFeeds } from './newsService.js';
import { DigestService } from './digestService.js';
import { AIAnalysisSchema, safeParseAIJSON, AISummarySchema } from '../utils/aiValidation.js';
import { emitNewArticle } from '../config/socket.js';
import logger from '../config/logger.js';

export const initCronJobs = () => {
    // 0. Daily Intelligence Digest (8:00 AM)
    cron.schedule('0 8 * * *', async () => {
        logger.info("📡 Dispatching Daily Intelligence Digests...");
        await DigestService.processDailyDigests();
    });

    // 0. News Intelligence Worker (Run every 5 minutes)
    // Find unsummarized articles and process them
    cron.schedule('*/5 * * * *', async () => {
        logger.info("🧠 Starting News Intelligence Worker...");
        try {
            const unsummarized = await prisma.newsCache.findMany({
                where: { 
                    OR: [
                        { aiSummary: null },
                        { impactCategory: null }
                    ]
                },
                take: 10 // Increased batch size for faster initial processing
            });

            for (const article of unsummarized) {
                try {
                    logger.info(`🤖 Summarizing: ${article.title}`);
                    // Trigger scrape + summary
                    const result = await getAISummarization(article.title, article.description || "", article.url);
                    
                    const validated = AISummarySchema.safeParse(result);
                    const data = validated.success ? validated.data : result;

                    await prisma.newsCache.update({
                        where: { id: article.id },
                        data: {
                            aiSummary: data.impact_verdict || data.summary[0], 
                            aiDetailedSummary: data.summary || [],
                            impactCategory: data.impact_category || "MARKET",
                            impactVerdict: data.impact_verdict,
                            sentimentScore: data.sentiment_score,
                            impactHorizon: data.impact_horizon || "Short-term",
                            tags: { push: data.key_concepts || [] },
                            risks: data.risks || []
                        }
                    });
                } catch (err) {
                    logger.error(`❌ Intelligence Worker Error for [${article.title}]: ${err.message}`);
                }
            }
        } catch (error) {
            logger.error(`Intelligence Worker Critical Error: ${error.message}`);
        }
    });

    // 1. Weekly Tech Analysis Refresh (Sunday at midnight)
    cron.schedule('0 0 * * 0', async () => {
        logger.info("🚀 Starting Weekly Tech Analysis Refresh...");
        try {
            const allRecords = await prisma.techAnalysis.findMany();
            for (const record of allRecords) {
                const userTech = record.techName;
                try {
                    const githubUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(userTech)}&sort=stars&order=desc`;
                    const githubRes = await fetch(githubUrl, {
                        headers: { 'User-Agent': 'TechPulse/1.0.0' }
                    });
                    if (!githubRes.ok) {
                        logger.warn(`❌ GitHub API Error [${githubRes.status}] for [${userTech}] at ${githubUrl}`);
                        continue;
                    }
                    
                    const text = await githubRes.text();
                    let githubData;
                    try {
                        githubData = JSON.parse(text);
                    } catch (e) {
                        logger.error(`❌ GitHub JSON Parse Error for [${userTech}]: ${e.message}. Received: ${text.slice(0, 100)}...`);
                        continue;
                    }

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

    // 3. AI-DRIVEN NEWS INGESTION (Every 4 hours)
    cron.schedule('0 */4 * * *', async () => {
        logger.info("📡 Starting AI-Driven RSS Ingestion Pipeline...");
        try {
            const articles = await fetchRSSFeeds();
            logger.info(`📻 Ingested ${articles.length} raw articles. Starting AI evaluation...`);

            let savedCount = 0;
            let filteredCount = 0;

            for (const article of articles) {
                try {
                    // 1. Evaluate with AI
                    const evaluation = await evaluateArticle(article.title + " " + article.description);
                    
                    // 2. Strict Filtering: relevanceScore >= 70 and impactHorizon != "Noise"
                    if (evaluation.relevanceScore >= 70 && evaluation.impactHorizon !== "Noise") {
                        const savedArticle = await prisma.newsCache.upsert({
                            where: { url: article.url },
                            update: {
                                relevanceScore: evaluation.relevanceScore,
                                credibilityScore: evaluation.credibilityScore,
                                impactHorizon: evaluation.impactHorizon,
                                impactCategory: evaluation.impactCategory,
                                cleanTitle: evaluation.cleanTitle,
                                aiSummary: evaluation.summary
                            },
                            create: {
                                title: article.title,
                                cleanTitle: evaluation.cleanTitle,
                                description: article.description,
                                aiSummary: evaluation.summary,
                                impactCategory: evaluation.impactCategory,
                                url: article.url,
                                source: article.source,
                                author: article.author,
                                tags: article.tags,
                                relevanceScore: evaluation.relevanceScore,
                                credibilityScore: evaluation.credibilityScore,
                                impactHorizon: evaluation.impactHorizon,
                                points: 0
                            }
                        });

                        // 3. Emit via socket for real-time dashboard update
                        emitNewArticle(savedArticle);
                        
                        savedCount++;
                    } else {
                        filteredCount++;
                    }
                } catch (evalError) {
                    logger.error(`❌ Evaluation Failed for ${article.url}: ${evalError.message}`);
                }
            }
            logger.info(`🏁 Ingestion Complete. Saved: ${savedCount}, Filtered (Noise): ${filteredCount}`);
        } catch (error) {
            logger.error(`Ingestion Pipeline Error: ${error.message}`);
        }
    });
};
