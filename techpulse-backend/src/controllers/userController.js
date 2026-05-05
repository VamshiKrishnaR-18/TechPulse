import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

export const updatePreferences = async (req, res) => {
    const { mutedTags, minRelevance, interests, notificationType, webhookUrl } = req.body;
    const userId = req.user.userId;

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(mutedTags && { mutedTags }),
                ...(minRelevance !== undefined && { minRelevance }),
                ...(interests && { interests }),
                ...(notificationType && { notificationType }),
                ...(webhookUrl !== undefined && { webhookUrl })
            },
            select: {
                id: true,
                email: true,
                interests: true,
                mutedTags: true,
                minRelevance: true,
                notificationType: true,
                webhookUrl: true
            }
        });

        res.json({ success: true, user });
    } catch (error) {
        logger.error(`Update preferences error: ${error.message}`);
        res.status(500).json({ success: false, message: "Failed to update preferences." });
    }
};

export const getPreferences = async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                interests: true,
                mutedTags: true,
                minRelevance: true,
                notificationType: true,
                webhookUrl: true
            }
        });

        res.json({ success: true, preferences: user });
    } catch (error) {
        logger.error(`Get preferences error: ${error.message}`);
        res.status(500).json({ success: false, message: "Failed to fetch preferences." });
    }
};

export const getPersonalInsight = async (req, res) => {
    const { trend, stack } = req.body;
    
    try {
        const prompt = `
            Cross-reference the following global technology trend with a developer's specific tech stack.
            
            Global Trend: ${trend}
            Developer Stack: ${stack}
            
            Task: Write a one-sentence personalized strategic insight explaining exactly why this trend matters to this specific developer. 
            Be technical, high-signal, and professional. Avoid generic fluff.
            
            Format: A single sentence starting with "This matters because..." or similar direct reasoning.
        `;

        const { default: groq } = await import('../config/groq.js');
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
        });

        res.json({ success: true, insight: completion.choices[0].message.content });
    } catch (error) {
        logger.error(`Personal insight error: ${error.message}`);
        res.status(500).json({ success: false, message: "Failed to generate insight." });
    }
};
