import logger from '../config/logger.js';

/**
 * Robust fetch helper with proper headers and error handling.
 * Prevents cloud IP blocking by using realistic User-Agent strings.
 */
const fetchWithHeaders = async (url, options = {}) => {
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };

    const res = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });

    if (!res.ok) {
        // Silence known 403s for Reddit in CI/Cloud to keep logs clean
        if (res.status === 403 && url.includes('reddit.com')) {
            return null;
        }
        logger.warn(`⚠️ External API Error [${res.status}] for ${url}`);
        return null;
    }

    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        logger.error(`❌ JSON Parse Error for ${url}: ${e.message}. Snippet: ${text.slice(0, 100)}`);
        return null;
    }
};

export const fetchMixedFeed = async ({ query = '', tab = 'For You', followedTechs = [] } = {}) => {
    try {
        const normalizedQuery = query.trim().toLowerCase();
        
        // 1. Determine search terms
        let searchTerms = normalizedQuery;
        if (tab === 'For You' && followedTechs.length > 0 && !normalizedQuery) {
            searchTerms = followedTechs.join(' OR ');
        }

        const firstKeyword = searchTerms.split(/\s+/).filter(Boolean)[0] || '';
        
        // 2. Define API URLs
        const urls = {
            hn: searchTerms
                ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerms)}&tags=story&hitsPerPage=30`
                : 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30',
            github: searchTerms
                ? `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerms)}+sort:stars&per_page=30`
                : `https://api.github.com/search/repositories?q=created:>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}+sort:stars&per_page=30`,
            devto: searchTerms
                ? `https://dev.to/api/articles?per_page=25&tag=${encodeURIComponent(firstKeyword)}`
                : 'https://dev.to/api/articles?per_page=30&top=7',
            reddit: searchTerms
                ? `https://www.reddit.com/r/programming/search.json?q=${encodeURIComponent(searchTerms)}&restrict_sr=1&sort=hot&limit=30`
                : 'https://www.reddit.com/r/programming/hot.json?limit=30'
        };

        // 3. Fetch data from all sources in parallel
        // HackerNews and GitHub are prioritized (stable), Dev.to and Reddit are secondary.
        const [hnData, githubData, devToData, redditData] = await Promise.all([
            fetchWithHeaders(urls.hn),
            fetchWithHeaders(urls.github, { headers: { 'Accept': 'application/vnd.github.v3+json' } }),
            fetchWithHeaders(urls.devto),
            fetchWithHeaders(urls.reddit)
        ]);

        // 4. Map and normalize data from each source
        const hnPosts = Array.isArray(hnData?.hits) ? hnData.hits.map(hit => ({
            id: `hn-${hit.objectID}`,
            title: hit.title || hit.story_title || 'Untitled',
            description: `Discussion on HackerNews with ${hit.num_comments || 0} comments.`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: 'HackerNews',
            author: hit.author || 'unknown',
            tags: ['news', 'trending'],
            createdAt: hit.created_at,
            points: hit.points || 0
        })) : [];

        const githubPosts = Array.isArray(githubData?.items) ? githubData.items.map(item => ({
            id: `github-${item.id}`,
            title: item.full_name,
            description: item.description || 'Trending repository on GitHub.',
            url: item.html_url,
            image: item.owner?.avatar_url || null,
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
            image: post.cover_image || post.social_image,
            source: 'Dev.to',
            author: post.user?.name || 'unknown',
            tags: post.tag_list || [],
            createdAt: post.published_at,
            points: post.public_reactions_count || 0
        })) : [];

        const redditPosts = Array.isArray(redditData?.data?.children) ? redditData.data.children.map(child => ({
            id: `reddit-${child.data.id}`,
            title: child.data.title,
            description: `Hot on r/${child.data.subreddit}`,
            url: `https://reddit.com${child.data.permalink}`,
            image: child.data.thumbnail?.startsWith('http') ? child.data.thumbnail : null,
            source: `r/${child.data.subreddit}`,
            author: child.data.author,
            tags: ['reddit', child.data.subreddit],
            createdAt: new Date(child.data.created_utc * 1000).toISOString(),
            points: child.data.ups || 0
        })) : [];

        // 5. Merge and sort
        const merged = [...hnPosts, ...githubPosts, ...devToPosts, ...redditPosts]
            .filter(item => item.title && item.url)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 6. Apply filtering/sorting based on tab
        if (!normalizedQuery) {
            if (tab === 'Trending') {
                return [...merged].sort((a, b) => (b.points || 0) - (a.points || 0));
            }
            if (tab === 'Recent') {
                return [...merged].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
            return merged;
        }

        return merged.filter(item => {
            const haystack = `${item.title} ${item.description} ${item.source} ${(item.tags || []).join(' ')}`.toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    } catch (error) {
        logger.error('Mixed Feed Fetch Error:', error.message);
        return [];
    }
};
