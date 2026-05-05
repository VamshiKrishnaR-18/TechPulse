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
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(tech)}&tags=comment&hitsPerPage=3`;
        const hnRes = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        
        if (!hnRes.ok) {
            console.warn(`⚠️ Sentiment API Response NOT OK [${hnRes.status}] for ${url}`);
            return [];
        }
        
        const text = await hnRes.text();
        let hnData;
        try {
            hnData = JSON.parse(text);
        } catch (e) {
            console.error(`❌ Sentiment JSON Parse Error for ${url}: ${e.message}. Received: ${text.slice(0, 100)}...`);
            return [];
        }

        if (!hnData || !Array.isArray(hnData.hits)) return [];
        
        return hnData.hits.map(hit => ({
            text: (hit.comment_text || '').replace(/<[^>]*>/g, '').slice(0, 300),
            source: "HackerNews",
            author: hit.author || 'unknown'
        }));
    } catch (error) {
        console.error("Sentiment Scraping Failed:", error.message);
        return [];
    }
};

export const scrapeArticle = async (url) => {
    try {
        console.log(`🌐 Scraping full content from: ${url}`);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(5000) // 5s timeout
        });
        
        if (!response.ok) return null;
        const html = await response.text();
        
        // Basic extraction: remove scripts, styles, and extract text
        const cleanText = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 3000); // ⚡ Optimized: Reduced from 8k to 3k chars to save tokens
            
        return cleanText.length > 200 ? cleanText : null;
    } catch (e) {
        console.error(`❌ Scrape failed for ${url}:`, e.message);
        return null;
    }
};

export const getAISummarization = async (title, description, url = null) => {
    let content = description;
    
    // ⚡ Optimization: Only scrape if description is extremely low quality/short
    const needsScrape = url && (
        description.toLowerCase().includes('comments') || 
        description.length < 300 || 
        description.toLowerCase().includes('strategic technical discussion')
    );

    if (needsScrape) {
        const scraped = await scrapeArticle(url);
        if (scraped) content = scraped;
    }

    // If still no content, or content is too short, we can't do a real synthesis
    if (!content || content.length < 50 || content === 'Comments') {
        throw new Error("Insufficient signal content for strategic synthesis.");
    }

    const prompt = `
        Analyze this tech news. If it's a long engineering blog (e.g. from Cloudflare, Netflix, Meta), focus on architectural decisions, performance trade-offs, and cost implications.
        
        Title: ${title}
        Content: ${content}
        
        Task:
        1. 3-5 high-impact bullet points summary. For long-form blogs, extract specific architectural shifts or technical solutions.
        2. 'main_tech' mentioned.
        3. 'sentiment_score' (0-100).
        4. 1-sentence 'impact_verdict'.
        5. 'impact_category': "SECURITY", "MARKET", "AI", "INFRA", "OSS", "PRODUCT", or "REG".
        6. 3 'key_concepts'.
        7. 1 'potential_risk'.

        JSON only:
        {
            "summary": ["string"],
            "main_tech": "string",
            "sentiment_score": number,
            "impact_verdict": "string",
            "impact_category": "string",
            "key_concepts": ["string"],
            "risks": ["string"]
        }
    `;

    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant", // ⚡ Optimized: Switched from 70b to 8b for 10x lower token cost
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
};

export const evaluateArticle = async (content) => {
    const prompt = `
        Evaluate the following technical news content for its relevance to professional developers and strategic technology trends.
        
        Content: ${content.slice(0, 2000)}
        
        Task:
        1. Assign a 'relevanceScore' (0-100) based on how much this affects the broader tech ecosystem.
        2. Assign a 'credibilityScore' (0-100) based on the technical depth and source quality.
        3. Determine the 'impactHorizon': "Immediate", "Short-term", "Long-term", or "Noise".
        4. Determine the 'impactCategory': Choose ONE from ["SECURITY", "MARKET", "AI BREAKTHROUGH", "INFRASTRUCTURE", "OPEN SOURCE", "REGULATION", "HARDWARE"].
        5. Provide a 'cleanTitle': A concise, professional title removing clickbait.
        6. Provide a 'summary': A 2-sentence strategic summary of why this matters to a senior developer.

        Respond strictly with a valid JSON object matching this schema:
        {
            "relevanceScore": number,
            "credibilityScore": number,
            "impactHorizon": "string",
            "impactCategory": "string",
            "cleanTitle": "string",
            "summary": "string"
        }
    `;

    return await withRetry(async () => {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0].message.content);
    });
};

export const getAIChatStream = async (message, article, history = []) => {
    const prompt = `
        You are the TechPulse Intelligence Assistant. You are helping a developer analyze a specific news article.
        
        ARTICLE CONTEXT:
        Title: ${article.cleanTitle || article.title}
        Source: ${article.source}
        Summary: ${article.description}
        AI Metadata: Relevance ${article.relevanceScore}%, Credibility ${article.credibilityScore}%, Impact: ${article.impactHorizon}

        INSTRUCTIONS:
        1. Answer the user's question based on the provided article context.
        2. If the user asks something outside the context, try to relate it back to the tech mentioned in the article.
        3. Keep responses technical, concise, and objective.
        4. Use markdown for formatting (bolding, lists, code snippets).
    `;

    return await withRetry(async () => {
        return await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: prompt },
                ...history,
                { role: "user", content: message }
            ],
            temperature: 0.3,
            stream: true
        });
    });
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
            "definition": "string (A concise, 1-2 sentence technical definition of what this technology is)",
            "metrics": { 
                "github_score": number (0-100 based on momentum/popularity), 
                "job_score": number (0-100 based on market demand), 
                "stability_score": number (0-100 based on ecosystem maturity) 
            },
            "insight": { "verdict": "string", "explanation": "string", "future_outlook": "string" },
            "sentiment_keywords": ["string", "string", "string"],
            "tech_stack": [{ "name": "string", "role": "string", "reason": "string" }],
            "roadmap": [{ "week": number, "topic": "string", "description": "string" }] // Provide 3-5 high-signal items
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
