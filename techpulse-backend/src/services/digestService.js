import prisma from '../config/prisma.js';
import logger from '../config/logger.js';
import fetch from 'node-fetch';

/**
 * Service to aggregate and deliver personalized technical digests.
 */
export const DigestService = {
    /**
     * Generates a daily digest for all active users.
     */
    async processDailyDigests() {
        logger.info("📅 Starting Daily Intelligence Digest process...");
        
        try {
            const users = await prisma.user.findMany({
                where: { 
                    notificationType: { not: "NONE" },
                    followedTechs: { some: {} }
                },
                include: { followedTechs: true }
            });

            logger.info(`👥 Found ${users.length} users for daily digest.`);

            for (const user of users) {
                await this.sendUserDigest(user);
            }
        } catch (error) {
            logger.error(`Daily Digest Error: ${error.message}`);
        }
    },

    /**
     * Aggregates and sends a digest to a single user.
     */
    async sendUserDigest(user) {
        try {
            const techInterests = user.followedTechs.map(f => f.techName.toLowerCase());
            
            // Find top 3 high-signal items from the last 24 hours matching interests
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const highSignalItems = await prisma.newsCache.findMany({
                where: {
                    createdAt: { gte: last24h },
                    OR: [
                        { title: { contains: techInterests[0] || "", mode: 'insensitive' } },
                        { tags: { hasSome: techInterests } }
                    ],
                    relevanceScore: { gte: 70 } // Only high signal
                },
                orderBy: { points: 'desc' },
                take: 3
            });

            if (highSignalItems.length === 0) {
                logger.info(`⏭️ Skipping digest for ${user.email} (No high-signal items found today).`);
                return;
            }

            // Deliver based on user preference
            if (user.notificationType === 'SLACK' || user.notificationType === 'DISCORD') {
                await this.deliverWebhook(user, highSignalItems);
            } else if (user.notificationType === 'EMAIL') {
                await this.deliverEmail(user, highSignalItems);
            }

            logger.info(`✅ Digest delivered to ${user.email} via ${user.notificationType}`);
        } catch (error) {
            logger.error(`Failed to send digest to ${user.email}: ${error.message}`);
        }
    },

    /**
     * Delivers formatted payload to Slack or Discord webhooks.
     */
    async deliverWebhook(user, items) {
        if (!user.webhookUrl) return;

        const isDiscord = user.notificationType === 'DISCORD';
        
        const payload = isDiscord ? {
            username: "TechPulse Intelligence",
            embeds: items.map(item => ({
                title: `[${item.impactCategory || "MARKET"}] ${item.title}`,
                description: item.aiSummary || item.description,
                url: item.url,
                color: 5814783, // TechPulse Blue
                fields: [
                    { name: "Signal Strength", value: `+${item.points}`, inline: true },
                    { name: "Relevance", value: `${item.relevanceScore}%`, inline: true }
                ]
            }))
        } : {
            text: `*TechPulse Daily Intelligence Digest for ${user.email}*`,
            blocks: items.flatMap(item => ([
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*<${item.url}|${item.title}>*\n_${item.aiSummary || item.description}_`
                    }
                },
                {
                    type: "context",
                    elements: [
                        { type: "mrkdwn", text: `*Signal:* +${item.points} | *Relevance:* ${item.relevanceScore}% | *Source:* ${item.source}` }
                    ]
                }
            ]))
        };

        await fetch(user.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    /**
     * Placeholder for email delivery logic.
     */
    async deliverEmail(user, items) {
        // Implementation using SendGrid/Nodemailer would go here
        logger.info(`📧 Email delivery simulation for ${user.email}`);
    }
};