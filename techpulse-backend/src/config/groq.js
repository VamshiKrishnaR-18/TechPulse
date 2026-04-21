import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let groq;

if (process.env.NODE_ENV === 'test') {
    // ✅ Mock Groq for tests
    groq = {
        chat: {
            completions: {
                create: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    summary: "Mock summary",
                                    main_tech: "AI"
                                })
                            }
                        }
                    ]
                })
            }
        }
    };
} else {
    // ✅ Real Groq for dev/prod
    groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1"
    });
}

export default groq;