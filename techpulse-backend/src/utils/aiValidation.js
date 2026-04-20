import { z } from 'zod';

export const AISummarySchema = z.object({
    summary: z.array(z.string().min(10)).min(3),
    main_tech: z.string().min(1),
    sentiment_score: z.number().min(0).max(100),
    impact_verdict: z.string().min(10),
    key_concepts: z.array(z.string()).min(3),
    risks: z.array(z.string()).min(1)
});

export const AIAnalysisSchema = z.object({
    metrics: z.object({
        github_score: z.number().min(0).max(100),
        job_score: z.number().min(0).max(100),
        stability_score: z.number().min(0).max(100)
    }),
    insight: z.object({
        verdict: z.string().min(5),
        explanation: z.string().min(20),
        future_outlook: z.string().min(20)
    }),
    sentiment_keywords: z.array(z.string()).min(3),
    tech_stack: z.array(z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        reason: z.string().min(5)
    })).min(2),
    roadmap: z.array(z.object({
        week: z.number().int().positive(),
        topic: z.string().min(1),
        description: z.string().min(10)
    })).min(3)
});

export const AISearchSuggestionSchema = z.object({
    suggestedQuery: z.string().min(1)
});

/**
 * Attempts to fix a potentially malformed JSON string from the LLM.
 * @param {string} str 
 * @returns {object|null}
 */
export const safeParseAIJSON = (str) => {
    try {
        // Try direct parse first
        return JSON.parse(str);
    } catch (e) {
        console.warn("⚠️ Initial JSON parse failed. Attempting to fix malformed string...");
        
        try {
            // Remove markdown code blocks if present
            const cleanStr = str.replace(/```json\n?|\n?```/g, '').trim();
            
            // Basic fix for unescaped characters in strings
            // (Note: This is simplified; real fixes might need more robust logic)
            return JSON.parse(cleanStr);
        } catch (innerE) {
            console.error("❌ Failed to parse and fix AI JSON:", innerE.message);
            return null;
        }
    }
};
