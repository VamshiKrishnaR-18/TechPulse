import logger from '../config/logger.js';

/**
 * 🚀 fetchSafe Helper
 * Fault-tolerant fetch that handles network errors, invalid JSON, and bot-blocking.
 * Returns null instead of throwing, allowing other APIs to succeed.
 */
const fetchSafe = async (url, options = {}) => {
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    try {
        const res = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
            // Add a timeout to prevent hanging requests in cloud environment
            signal: AbortSignal.timeout(8000) 
        });

        if (!res.ok) {
            // Log warning but don't throw; Reddit 403s are common on cloud IPs
            if (!(res.status === 403 && url.includes('reddit.com'))) {
                logger.warn(`⚠️ External API Error [${res.status}] for ${url}`);
            }
            return null;
        }

        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            logger.error(`❌ JSON Parse Error for ${url}: ${e.message}. Snippet: ${text.slice(0, 100)}`);
            return null;
        }
    } catch (error) {
        logger.error(`📡 Network/Timeout Error for ${url}: ${error.message}`);
        return null;
    }
};

export const fetchMixedFeed = async ({ query = '', tab = 'For You', followedTechs = [] } = {}) => {
    try {
        const normalizedQuery = query.trim().toLowerCase();
        
        // 1. Prepare search terms
        let searchTerms = normalizedQuery;
        if (tab === 'For You' && followedTechs.length > 0 && !normalizedQuery) {
            searchTerms = followedTechs.join(' OR ');
        }
        const firstKeyword = searchTerms.split(/\s+/).filter(Boolean)[0] || '';
        
        // 2. Define source URLs
        const urls = {
            hn: searchTerms
                ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerms)}&tags=story&hitsPerPage=30`
                : 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30',
            github: searchTerms
                ? `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerms)}&sort=stars&order=desc&per_page=30`
                : `https://api.github.com/search/repositories?q=created:>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort=stars&order=desc&per_page=30`,
            devto: searchTerms
                ? `https://dev.to/api/articles?per_page=25&tag=${encodeURIComponent(firstKeyword)}`
                : 'https://dev.to/api/articles?per_page=30&top=7',
            reddit: searchTerms
                ? `https://www.reddit.com/r/programming/search.json?q=${encodeURIComponent(searchTerms)}&restrict_sr=1&sort=hot&limit=30`
                : 'https://www.reddit.com/r/programming/hot.json?limit=30'
        };

        // 3. Parallel Fetch (Fail-Independent)
        const [hnData, githubData, devToData, redditData] = await Promise.all([
            fetchSafe(urls.hn),
            fetchSafe(urls.github, { headers: { 'Accept': 'application/vnd.github.v3+json' } }),
            fetchSafe(urls.devto),
            fetchSafe(urls.reddit)
        ]);

        // 4. Safe Mapping (Handle Nulls & Extract Images)
        const hnPosts = Array.isArray(hnData?.hits) ? hnData.hits.map(hit => {
            // HackerNews doesn't provide images directly. 
            // We use a high-quality placeholder service based on the source domain or a tech category
            const domain = hit.url ? new URL(hit.url).hostname : 'news.ycombinator.com';
            const imageUrl = `https://unavatar.io/duckduckgo/${domain}`;

            return {
                id: `hn-${hit.objectID}`,
                title: hit.title || hit.story_title || 'Untitled',
                description: `Discussion on HackerNews with ${hit.num_comments || 0} comments.`,
                url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
                image: imageUrl, // Dynamic domain-based icon
                source: 'HackerNews',
                author: hit.author || 'unknown',
                tags: ['news', 'trending'],
                createdAt: hit.created_at,
                points: hit.points || 0
            };
        }) : [];

        const githubPosts = Array.isArray(githubData?.items) ? githubData.items.map(item => ({
            id: `github-${item.id}`,
            title: item.full_name,
            description: item.description || 'Trending repository on GitHub.',
            url: item.html_url,
            image: item.owner?.avatar_url || `https://opengraph.githubassets.com/1/${item.full_name}`, // Use OG image if possible
            source: 'GitHub',
            author: item.owner?.login || 'unknown',
            tags: ['github', item.language || 'code', 'trending'],
            createdAt: item.created_at,
            points: item.stargazers_count || 0
        })) : [];

        const devToPosts = Array.isArray(devToData) ? devToData.map(post => ({
            id: `devto-${post.id}`,
            title: post.title,
            description: post.description || '',
            url: post.url,
            image: post.cover_image || post.social_image || `https://unavatar.io/devto/${post.user?.username}`,
            source: 'Dev.to',
            author: post.user?.name || 'unknown',
            tags: post.tag_list || [],
            createdAt: post.published_at,
            points: post.public_reactions_count || 0
        })) : [];

        const redditPosts = Array.isArray(redditData?.data?.children) ? redditData.data.children.map(child => {
            const data = child.data;
            // Reddit thumbnails are often 'self', 'default', or 'nsfw'. Filter those out.
            const hasRealThumbnail = data.thumbnail && data.thumbnail.startsWith('http');
            const redditImage = hasRealThumbnail ? data.thumbnail : `https://unavatar.io/reddit/${data.subreddit}`;

            return {
                id: `reddit-${data.id}`,
                title: data.title,
                description: `Hot on r/${data.subreddit}`,
                url: `https://reddit.com${data.permalink}`,
                image: redditImage,
                source: `r/${data.subreddit}`,
                author: data.author,
                tags: ['reddit', data.subreddit],
                createdAt: new Date(data.created_utc * 1000).toISOString(),
                points: data.ups || 0
            };
        }) : [];

        // 5. Merge & Debug Logs
        const merged = [...hnPosts, ...githubPosts, ...devToPosts, ...redditPosts]
            .filter(item => item.title && item.url)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 🚀 CRITICAL DEBUG LOGS PER USER REQUEST
        console.log("DEVTO:", devToPosts.length);
        console.log("HN:", hnPosts.length);
        console.log("REDDIT:", redditPosts.length);
        console.log("GITHUB:", githubPosts.length);
        console.log("MERGED:", merged.length);

        // 6. Final Filter/Tab logic with Relaxed Matching
        if (!normalizedQuery) {
            if (tab === 'Trending') return [...merged].sort((a, b) => (b.points || 0) - (a.points || 0));
            if (tab === 'Recent') return [...merged].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return merged;
        }

        const filtered = merged.filter(item => {
            const haystack = `${item.title} ${item.description} ${item.source} ${(item.tags || []).join(' ')}`.toLowerCase();
            // 🚀 RELAXED FILTERING PER USER REQUEST
            return haystack.includes(normalizedQuery) || normalizedQuery.length < 3;
        });

        // 🚀 FALLBACK TO MERGED IF FILTERING REMOVES EVERYTHING
        if (filtered.length === 0 && merged.length > 0) {
            logger.warn(`Filtering for [${normalizedQuery}] returned 0 items. Falling back to original merged feed.`);
            return merged;
        }

        return filtered;
    } catch (error) {
        logger.error('CRITICAL: Mixed Feed Aggregator Failed:', error.message);
        return []; 
    }
};
