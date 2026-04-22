import logger from '../config/logger.js';
import redisClient from '../config/redis.js';
import prisma from '../config/prisma.js';

/**
 * 🚀 fetchSafe Helper
 * Fault-tolerant fetch that handles network errors, invalid JSON, and bot-blocking.
 * Returns null instead of throwing, allowing other APIs to succeed.
 */
const fetchSafe = async (url, options = {}) => {
    // 1. Check Redis Cache first (with safe client check)
    const cacheKey = `feed:raw:${url}`;
    try {
        if (redisClient?.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }
    } catch (err) {
        logger.warn(`Redis Get Error for ${url}: ${err.message}`);
    }

    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    try {
        const fetchOptions = {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
            // Add a timeout to prevent hanging requests in cloud environment
            signal: AbortSignal.timeout(url.includes('reddit.com') ? 12000 : 8000)
        };

        const res = await fetch(url, fetchOptions);

        if (!res.ok) {
            // Log warning but don't throw; Reddit 403s are common on cloud IPs
            if (!(res.status === 403 && url.includes('reddit.com'))) {
                logger.warn(`⚠️ External API Error [${res.status}] for ${url}`);
            }
            return null;
        }

        const text = await res.text();
        try {
            const data = JSON.parse(text);

            // 2. Cache successful response in Redis (Expire in 15 mins)
            if (redisClient?.isOpen && data) {
                await redisClient.set(cacheKey, JSON.stringify(data), { EX: 900 });
            }

            return data;
        } catch (e) {
            logger.error(`❌ JSON Parse Error for ${url}: ${e.message}. Snippet: ${text.slice(0, 100)}`);
            return null;
        }
    } catch (error) {
        logger.error(`📡 Network/Timeout Error for ${url}: ${error.message}`);
        return null;
    }
};

/**
 * 💾 Global News Cacher
 * Stores articles in PostgreSQL NewsCache for reliable fallbacks.
 */
const cacheToDatabase = async (articles) => {
    if (!articles || articles.length === 0) return;

    try {
        // We only cache the top 20 items to keep DB size manageable
        const itemsToCache = articles.slice(0, 20);

        for (const article of itemsToCache) {
            await prisma.newsCache.upsert({
                where: { url: article.url },
                update: {
                    points: article.points || 0,
                    image: article.image || null
                },
                create: {
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    source: article.source,
                    image: article.image,
                    author: article.author,
                    tags: article.tags || [],
                    points: article.points || 0
                }
            });
        }
    } catch (err) {
        logger.error(`DB News Cache Error: ${err.message}`);
    }
};

/**
 * 🏆 Rank Score Helper
 * Calculates a unified score for sorting: score = points + recency + source weight
 */
const calculateRankScore = (item) => {
    const now = new Date();
    const created = new Date(item.createdAt);

    // Safety check for invalid dates
    if (isNaN(created.getTime())) return (item.points || 0);

    // 1. Recency Score (Higher for newer posts)
    // 10 points per hour, decaying over 48 hours
    const hoursOld = Math.max(0, (now - created) / (1000 * 60 * 60));
    const recencyScore = Math.max(0, 480 - (hoursOld * 10));

    // 2. Points Score (Weighted raw points)
    const pointsScore = (item.points || 0) * 1.5;

    // 3. Source Weighting
    const sourceWeights = {
        'GitHub': 100,      // High value code signals
        'HackerNews': 80,  // High quality discussion
        'Dev.to': 40,      // Community tutorials
        'Reddit': 20       // High volume social
    };
    const sourceScore = sourceWeights[item.source] || 0;

    return recencyScore + pointsScore + sourceScore;
};

export const fetchMixedFeed = async ({ query = '', tab = 'For You', followedTechs = [] } = {}) => {
    try {
        const normalizedQuery = query.trim().toLowerCase();

        // 🔐 Cache key
        const finalCacheKey = `feed:final:${normalizedQuery}:${tab}:${followedTechs.join(',')}`;
        try {
            if (redisClient?.isOpen) {
                const cachedFinal = await redisClient.get(finalCacheKey);
                if (cachedFinal) return JSON.parse(cachedFinal);
            }
        } catch {}

        // 🧠 Search terms
        let searchTerms = normalizedQuery;
        if (tab === 'For You' && followedTechs.length > 0 && !normalizedQuery) {
            searchTerms = followedTechs.join(' OR ');
        }

        const firstKeyword = searchTerms.split(/\s+/).filter(Boolean)[0] || '';

        // 🌐 URLs
        const urls = {
            hn: searchTerms
                ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerms)}&tags=story&hitsPerPage=30`
                : (tab === 'Recent' 
                    ? 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=30'
                    : 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30'),

            github: searchTerms
                ? `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerms)}&sort=stars&order=desc&per_page=30`
                : (tab === 'Recent'
                    ? `https://api.github.com/search/repositories?q=created:>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort=updated&order=desc&per_page=30`
                    : `https://api.github.com/search/repositories?q=stars:>5000&sort=stars&order=desc&per_page=30`),

            devto: searchTerms
                ? `https://dev.to/api/articles?per_page=25&tag=${encodeURIComponent(firstKeyword)}`
                : (tab === 'Recent'
                    ? 'https://dev.to/api/articles?per_page=30&latest=true'
                    : 'https://dev.to/api/articles?per_page=30&top=7'),

            reddit: searchTerms
                ? `https://www.reddit.com/r/programming/search.json?q=${encodeURIComponent(searchTerms)}&restrict_sr=1&sort=hot&limit=30`
                : (tab === 'Recent'
                    ? 'https://www.reddit.com/r/programming/new.json?limit=30'
                    : 'https://www.reddit.com/r/programming/hot.json?limit=30')
        };

        console.log("🚀 Fetching for:", searchTerms || "trending");

        const [hnData, githubData, devToData, redditData] = await Promise.all([
            fetchSafe(urls.hn),
            fetchSafe(urls.github),
            fetchSafe(urls.devto),
            fetchSafe(urls.reddit)
        ]);

        // 🧩 SAFE HELPERS
        const safeDate = (date) => {
            const d = new Date(date);
            return isNaN(d.getTime()) ? new Date() : d;
        };

        const safeDomain = (url) => {
            try {
                return new URL(url).hostname;
            } catch {
                return 'news.ycombinator.com';
            }
        };

        // 🔹 HN
        const hnPosts = Array.isArray(hnData?.hits) ? hnData.hits.map(hit => ({
            id: `hn-${hit.objectID}`,
            title: hit.title || hit.story_title || 'Untitled',
            description: `Discussion on HackerNews`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            image: `https://unavatar.io/duckduckgo/${safeDomain(hit.url)}`,
            source: 'HackerNews',
            author: hit.author || 'unknown',
            tags: ['news'],
            createdAt: safeDate(hit.created_at),
            points: hit.points || 0
        })) : [];

        // 🔹 GitHub
        const githubPosts = Array.isArray(githubData?.items) ? githubData.items.map(item => ({
            id: `github-${item.id}`,
            title: item.full_name,
            description: item.description || 'GitHub repo',
            url: item.html_url,
            image: item.owner?.avatar_url,
            source: 'GitHub',
            author: item.owner?.login || 'unknown',
            tags: [item.language || 'code'],
            createdAt: safeDate(item.created_at),
            points: item.stargazers_count || 0
        })) : [];

        // 🔹 Dev.to
        const devToPosts = Array.isArray(devToData) ? devToData.map(post => ({
            id: `devto-${post.id}`,
            title: post.title,
            description: post.description || '',
            url: post.url,
            image: post.cover_image || post.social_image,
            source: 'Dev.to',
            author: post.user?.name || 'unknown',
            tags: post.tag_list || [],
            createdAt: safeDate(post.published_at),
            points: post.public_reactions_count || 0
        })) : [];

        // 🔹 Reddit
        const redditPosts = Array.isArray(redditData?.data?.children)
            ? redditData.data.children.map(child => {
                const d = child.data;
                return {
                    id: `reddit-${d.id}`,
                    title: d.title,
                    description: `r/${d.subreddit}`,
                    url: `https://reddit.com${d.permalink}`,
                    image: d.thumbnail?.startsWith('http') ? d.thumbnail : null,
                    source: 'Reddit',
                    author: d.author,
                    tags: [d.subreddit],
                    createdAt: safeDate(new Date(d.created_utc * 1000)),
                    points: d.ups || 0
                };
            })
            : [];

        // 🧮 MERGE
        let merged = [...hnPosts, ...githubPosts, ...devToPosts, ...redditPosts]
            .filter(item => item.title && item.url);

        console.log("HN:", hnPosts.length);
        console.log("GH:", githubPosts.length);
        console.log("DEV:", devToPosts.length);
        console.log("RED:", redditPosts.length);
        console.log("MERGED:", merged.length);

        // 🏆 DYNAMIC SORT BASED ON TAB
        if (tab === 'Recent') {
            merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (tab === 'Trending') {
            merged.sort((a, b) => calculateRankScore(b) - calculateRankScore(a));
        } else {
            // For You: Personalize by boosting followed techs
            merged.sort((a, b) => {
                const aRelevance = followedTechs.some(tech => 
                    a.title.toLowerCase().includes(tech.toLowerCase()) || 
                    a.tags.some(t => t.toLowerCase().includes(tech.toLowerCase()))
                ) ? 1000 : 0;
                
                const bRelevance = followedTechs.some(tech => 
                    b.title.toLowerCase().includes(tech.toLowerCase()) || 
                    b.tags.some(t => t.toLowerCase().includes(tech.toLowerCase()))
                ) ? 1000 : 0;

                return (b.points + bRelevance) - (a.points + aRelevance);
            });
        }

        // 🔍 FILTER
        let result = merged;

        if (normalizedQuery.length >= 3) {
            result = merged.filter(item => {
                const text = `${item.title} ${item.description}`.toLowerCase();
                return text.includes(normalizedQuery);
            });

            if (result.length === 0) {
                console.warn("⚠️ Filter returned empty → fallback");
                result = merged;
            }
        }

        console.log("✅ FINAL RESULT:", result.length);

        // 💾 Cache
        if (redisClient?.isOpen && result.length > 0) {
            await redisClient.set(finalCacheKey, JSON.stringify(result), { EX: 300 });
        }

        return result;

    } catch (err) {
        console.error("❌ CRITICAL FEED ERROR:", err.message);
        return [];
    }
};
