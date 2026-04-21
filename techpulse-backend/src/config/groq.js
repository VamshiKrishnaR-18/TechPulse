import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🚀 Real Groq Client (OpenAI-compatible)
 * Used for AI-driven tech analysis and news summarization.
 * 
 * NOTE: Mocking has been removed per user requirement.
 * Ensure GROQ_API_KEY is present in your environment variables.
 */
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export default groq;
