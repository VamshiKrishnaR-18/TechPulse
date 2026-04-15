import groq from '../config/groq.js';

export const withRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRateLimit = error.status === 429 || (error.message && error.message.includes("429"));
            if (!isRateLimit || i === maxRetries - 1) throw error;
            
            const delay = initialDelay * Math.pow(2, i);
            console.log(`⚠️ Rate limited (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw lastError;
};

export const fetchSentiment = async (tech) => {
    try {
        console.log(`🔍 Scraping developer sentiment for [${tech}]...`);
        const hnRes = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(tech)}&tags=comment&hitsPerPage=3`);
        const hnData = await hnRes.json();
        
        return hnData.hits.map(hit => ({
            text: hit.comment_text.replace(/<[^>]*>/g, '').slice(0, 300),
            source: "HackerNews",
            author: hit.author
        }));
    } catch (error) {
        console.error("Sentiment Scraping Failed:", error.message);
        return [];
    }
};

export const getAISummarization = async (title, description) => {
    const prompt = `
        Analyze this tech news item for a high-level executive dashboard:
        Title: ${title}
        Context: ${description}
        
        Task:
        1. Summarize the core development in 6-10 detailed, high-impact bullet points. Each point should be a complete thought (15-20 words).
        2. Identify the 'main_tech' mentioned.
        3. Provide a 'sentiment_score' (0-100).
        4. Write a 2-sentence 'impact_verdict' explaining the long-term significance of this news for the industry.
        5. Extract 5-6 'key_concepts' or 'technical_tags' that define the technical domain (e.g., "Event Loop", "Memory Safety", "Low-latency").
        6. Identify 'potential_risks' or 'challenges' associated with this development (1-2 items).

        Respond strictly with a valid JSON object matching this schema:
        {
            "summary": ["string", "string", "string", "string", "string"],
            "main_tech": "string",
            "sentiment_score": number,
            "impact_verdict": "string",
            "key_concepts": ["string", "string", "string", "string", "string"],
            "risks": ["string", "string"]
        }
    `;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
};

export const getAIAnalysisStream = async (userTech, topRepo, sentiment) => {
    const prompt = `
        Analyze the technology: ${userTech}. 
        Contextual Data:
        - GitHub Stats: Stars ${topRepo.stargazers_count}, Forks ${topRepo.forks_count}
        - Recent Developer Sentiment: ${sentiment.map(s => s.text).join('\n')}

        Task: Provide a strategic analysis including metrics on a scale of 0-100.
        
        Strict JSON Schema:
        {
            "metrics": { 
                "github_score": number (0-100 based on momentum/popularity), 
                "job_score": number (0-100 based on market demand), 
                "stability_score": number (0-100 based on ecosystem maturity) 
            },
            "insight": { "verdict": "string", "explanation": "string", "future_outlook": "string" },
            "sentiment_keywords": ["string", "string", "string"],
            "tech_stack": [{ "name": "string", "role": "string", "reason": "string" }],
            "roadmap": [{ "week": number, "topic": "string", "description": "string" }]
        }
    `;

    return await withRetry(async () => {
        return await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "You are TechPulse Advisor." }, { role: "user", content: prompt }],
            temperature: 0.1,
            stream: true,
            response_format: { type: "json_object" }
        });
    });
};

export const getAISearchSuggestion = async (query) => {
    const prompt = `
        A user is searching for tech news with this query: "${query}".
        If the query is clear and correct, return it as is.
        If it's misspelled or looks like gibberish but resembles a tech term, provide the most likely intended tech term.
        If it's total gibberish, return the most popular tech term currently (e.g., "AI").
        
        Respond with a single JSON object:
        { "suggestedQuery": "string" }
    `;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
};
