import logger from '../config/logger.js';
import redisClient from '../config/redis.js';
import prisma from '../config/prisma.js';
import Parser from 'rss-parser';

const parser = new Parser();

const RSS_TARGETS = [
    { name: 'InfoQ', url: 'https://feed.infoq.com/' },
    { name: 'HackerNews', url: 'https://news.ycombinator.com/rss' },
    { name: 'GitHub Trending', url: 'https://github-rss.vercel.app/repositories/daily' },
    { name: 'Daily.dev', url: 'https://rss.daily.dev/rss' },
    { name: 'Cloudflare', url: 'https://blog.cloudflare.com/rss/' },
    { name: 'Netflix', url: 'https://netflixtechblog.com/feed' },
    { name: 'Stripe', url: 'https://stripe.com/blog/feed.rss' },
    { name: 'Meta', url: 'https://engineering.fb.com/feed/' },
    { name: 'Vercel', url: 'https://vercel.com/blog/feed' },
    { name: 'AWS', url: 'https://aws.amazon.com/blogs/aws/feed/' },
    { name: 'OpenAI', url: 'https://openai.com/news/rss.xml' }
];

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
 * 📻 RSS Ingestion Engine
 * Fetches and normalizes RSS feeds from target URLs.
 */
export const fetchRSSFeeds = async () => {
    // 🚀 Speed Optimization: Parallel fetch with Promise.allSettled
    const feedPromises = RSS_TARGETS.map(async (target) => {
        const cacheKey = `rss:feed:${target.name}`;
        
        // 1. Try Redis Cache first for speed (15 min cache)
        if (redisClient?.isOpen) {
            const cached = await redisClient.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }

        try {
            const feed = await parser.parseURL(target.url);
            const normalized = feed.items.map(item => ({
                id: `rss-${target.name}-${item.guid || item.link}`,
                title: item.title,
                description: item.contentSnippet || item.content || `Strategic technical insights from ${target.name}.`,
                url: item.link,
                source: target.name,
                author: item.creator || item.author || 'unknown',
                createdAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                tags: item.categories || [target.name.toLowerCase()]
            }));

            // 2. Cache successful result
            if (redisClient?.isOpen) {
                await redisClient.set(cacheKey, JSON.stringify(normalized), { EX: 900 });
            }
            return normalized;
        } catch (err) {
            logger.error(`❌ RSS Fetch Error [${target.name}]: ${err.message}`);
            return [];
        }
    });

    const results = await Promise.allSettled(feedPromises);
    return results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);
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
        'HackerNews': 80,   // High quality discussion
        'Cloudflare': 150,  // Tier-1 Engineering
        'Netflix': 150,
        'Stripe': 150,
        'Meta': 150,
        'Vercel': 150,
        'AWS': 150,
        'OpenAI': 150,
        'Dev.to': 40,
        'Reddit': 20
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
                ? `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerms)}+pushed:>${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort=stars&order=desc&per_page=30`
                : 'https://github-rss.vercel.app/repositories/daily', // 🚀 Switching to Daily Trending RSS for fresh intelligence

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

        const [hnData, githubRaw, devToData, redditData, rssData] = await Promise.all([
            fetchSafe(urls.hn),
            fetchSafe(urls.github),
            fetchSafe(urls.devto),
            fetchSafe(urls.reddit),
            fetchRSSFeeds() // 📻 Ingest Tier-1 Engineering Blogs
        ]);

        // 🧠 Normalize GitHub Data (Handle both RSS and API JSON)
        let githubData = githubRaw;
        if (urls.github.includes('github-rss.vercel.app')) {
            // It's RSS, we need to map it to a similar structure
            githubData = {
                items: githubRaw?.items?.map(item => {
                    return {
                        id: item.guid || item.link,
                        full_name: item.title,
                        description: item.contentSnippet || item.description || '',
                        html_url: item.link,
                        owner: { avatar_url: null },
                        stargazers_count: parseInt(item.content?.match(/(\d+) stars today/)?.[1] || '500'),
                        updated_at: item.pubDate,
                        language: item.categories?.[0] || 'code'
                    };
                }) || []
            };
        }

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
        const hnPosts = Array.isArray(hnData?.hits) ? hnData.hits.map(hit => {
            const title = hit.title || hit.story_title || 'Untitled';
            const rawDescription = hit.story_text || '';
            const description = (rawDescription === 'Comments' || rawDescription.length < 5)
                ? `Strategic technical discussion on HackerNews regarding ${title}.`
                : rawDescription;
            
            return {
                id: `hn-${hit.objectID}`,
                title,
                description: description.length > 200 ? description.substring(0, 200) + '...' : description,
                url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
                image: `https://unavatar.io/duckduckgo/${safeDomain(hit.url)}`,
                source: 'HackerNews',
                author: hit.author || 'unknown',
                tags: ['news', ...(hit._tags || []).filter(t => !['story', 'front_page', 'author_', 'comment'].some(f => t.startsWith(f)))],
                createdAt: safeDate(hit.created_at),
                points: hit.points || 0
            };
        }) : [];

        // 🔹 GitHub
        const githubPosts = Array.isArray(githubData?.items) 
            ? githubData.items
                .filter(item => item.stargazers_count >= 500) // 🛡️ AI Bouncer: Minimum 500 stars
                .map(item => {
                    const rawDesc = item.description || '';
                    const description = (rawDesc === 'Comments' || rawDesc.length < 5)
                        ? `A trending repository on GitHub: ${item.full_name}`
                        : rawDesc;
                        
                    return {
                        id: `github-${item.id}`,
                        title: item.full_name,
                        description: description,
                        url: item.html_url,
                        image: null, // Kill identicons
                        source: 'GitHub',
                        author: item.owner?.login || 'unknown',
                        tags: [item.language || 'code'],
                        createdAt: safeDate(item.updated_at || item.pushed_at || item.created_at),
                        points: item.stargazers_count || 0,
                        // Seeded AI Metadata
                        relevanceScore: 70,
                        credibilityScore: 85,
                        impactHorizon: 'Short-term'
                    };
                }) : [];

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
        const redditPosts = Array.isArray(redditData?.data?.children) ? redditData.data.children.map(child => {
            const item = child.data;
            const rawDesc = item.selftext || '';
            const description = (rawDesc === 'Comments' || rawDesc.length < 5)
                ? `Strategic technical discussion in r/${item.subreddit}.`
                : rawDesc;

            return {
                id: `reddit-${item.id}`,
                title: item.title,
                description: description,
                url: `https://reddit.com${item.permalink}`,
                image: item.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : null,
                source: `r/${item.subreddit}`,
                author: item.author || 'unknown',
                tags: [item.subreddit],
                createdAt: safeDate(item.created_utc * 1000),
                points: item.ups || 0
            };
        }) : [];

        // 🧮 MERGE & CLEAN
        const STATIC_LIST_KEYWORDS = ['awesome', 'list', 'curated', 'collection', 'roadmap', 'free-programming-books', 'interview-university'];
        
        const merged = [...hnPosts, ...githubPosts, ...devToPosts, ...redditPosts, ...(rssData || [])]
            .filter(item => item.title && item.url)
            // 🛡️ AI Bouncer V2: Drop static reference lists and personal homework
            .filter(item => {
                const titleLower = item.title.toLowerCase();
                const descLower = item.description.toLowerCase();
                
                // Drop if it's a known static list pattern
                const isStaticList = STATIC_LIST_KEYWORDS.some(kw => 
                    titleLower.includes(kw) || descLower.includes(kw)
                );
                
                // Drop if it looks like a personal project or homework
                const isPersonalProject = titleLower.includes('homework') || 
                                       titleLower.includes('my-first') || 
                                       titleLower.includes('portfolio');
                
                return !isStaticList && !isPersonalProject;
            })
            .filter((item, index, self) => self.findIndex(t => t.url === item.url) === index); // 🛡️ Unique URLs only

        // 💾 Save high-signal articles to DB for background processing
        // We do this asynchronously to not block the main feed response
        cacheToDatabase(merged).catch(err => console.error("⚠️ Background caching failed:", err.message));

        // 🧠 ENRICH WITH AI CACHE
        let enriched = merged;
        try {
            const urls = merged.map(i => i.url);
            const cachedData = await prisma.newsCache.findMany({
                where: { url: { in: urls } }
            });

            if (cachedData.length > 0) {
                const cacheMap = new Map(cachedData.map(c => [c.url, c]));
                enriched = merged.map(item => {
                    const cached = cacheMap.get(item.url);
                    if (cached) {
                        return {
                            ...item,
                            cleanTitle: cached.cleanTitle || item.title,
                            aiSummary: cached.aiSummary,
                            impactCategory: cached.impactCategory,
                            relevanceScore: cached.relevanceScore || item.relevanceScore,
                            credibilityScore: cached.credibilityScore || item.credibilityScore,
                            impactHorizon: cached.impactHorizon || item.impactHorizon
                        };
                    }
                    return item;
                });
            }
        } catch (e) {
            console.error("⚠️ Feed enrichment error:", e.message);
        }

        console.log("HN:", hnPosts.length);
        console.log("GH:", githubPosts.length);
        console.log("DEV:", devToPosts.length);
        console.log("RED:", redditPosts.length);
        console.log("MERGED:", merged.length);

        // 🏆 DYNAMIC SORT BASED ON TAB
        if (tab === 'Recent') {
            enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (tab === 'Trending') {
            enriched.sort((a, b) => calculateRankScore(b) - calculateRankScore(a));
        } else {
            // For You: Personalize by boosting followed techs and considering rank score
            enriched.sort((a, b) => {
                const aRelevance = followedTechs.some(tech => 
                    a.title.toLowerCase().includes(tech.toLowerCase()) || 
                    a.tags.some(t => t.toLowerCase().includes(tech.toLowerCase()))
                ) ? 2000 : 0; // High boost for followed techs
                
                const bRelevance = followedTechs.some(tech => 
                    b.title.toLowerCase().includes(tech.toLowerCase()) || 
                    b.tags.some(t => t.toLowerCase().includes(tech.toLowerCase()))
                ) ? 2000 : 0;

                const aScore = calculateRankScore(a) + aRelevance;
                const bScore = calculateRankScore(b) + bRelevance;

                return bScore - aScore;
            });
        }

        // 🔍 FILTER
        let result = enriched;

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
