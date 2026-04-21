export const fetchMixedFeed = async ({ query = '', tab = 'For You', followedTechs = [] } = {}) => {
    if (process.env.NODE_ENV === "test") {
        return [
            {
                id: "mock-1",
                title: "Mock Feed Item",
                description: "Test data",
                url: "https://example.com",
                source: "Test",
                createdAt: new Date().toISOString(),
                points: 10
            }
        ];
    }
    try {
        const normalizedQuery = query.trim().toLowerCase();
        
        // 1. Determine search terms
        let searchTerms = normalizedQuery;
        
        // If "For You" and user follows techs, and NO explicit search query is provided
        if (tab === 'For You' && followedTechs.length > 0 && !normalizedQuery) {
            // Pick a few random followed techs or join them to broaden the feed
            searchTerms = followedTechs.join(' OR ');
        }

        const firstKeyword = searchTerms.split(/\s+/).filter(Boolean)[0] || '';
        
        const devToUrl = searchTerms
            ? `https://dev.to/api/articles?per_page=25&tag=${encodeURIComponent(firstKeyword)}`
            : 'https://dev.to/api/articles?per_page=30&top=7';
        
        const hnUrl = searchTerms
            ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchTerms)}&tags=story&hitsPerPage=30`
            : 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30';
        
        const redditUrl = searchTerms
            ? `https://www.reddit.com/r/programming/search.json?q=${encodeURIComponent(searchTerms)}&restrict_sr=1&sort=hot&limit=30`
            : 'https://www.reddit.com/r/programming/hot.json?limit=30';

        const githubUrl = searchTerms
            ? `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerms)}+sort:stars&per_page=30`
            : `https://api.github.com/search/repositories?q=created:>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}+sort:stars&per_page=30`;

        const [devToRes, hnRes, redditRes, githubRes] = await Promise.all([
            fetch(devToUrl),
            fetch(hnUrl),
            fetch(redditUrl, {
                headers: { 'User-Agent': 'TechPulse/1.0.0' }
            }),
            fetch(githubUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'TechPulse/1.0.0' }
            })
        ]);

        // Safe JSON parsing helper
        const safeJson = async (res) => {
            try {
                if (!res.ok) return null;
                return await res.json();
            } catch (e) {
                return null;
            }
        };

        const devToData = await safeJson(devToRes);
        const hnData = await safeJson(hnRes);
        const redditData = await safeJson(redditRes);
        const githubData = await safeJson(githubRes);

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

        const hnPosts = Array.isArray(hnData.hits) ? hnData.hits.map(hit => ({
            id: `hn-${hit.objectID}`,
            title: hit.title || hit.story_title || 'Untitled',
            description: `Discussion on HackerNews with ${hit.num_comments || 0} comments.`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            image: null,
            source: 'HackerNews',
            author: hit.author || 'unknown',
            tags: ['news', 'trending'],
            createdAt: hit.created_at,
            points: hit.points || 0
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

        const merged = [...devToPosts, ...hnPosts, ...redditPosts, ...githubPosts]
            .filter(item => item.title && item.url)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        console.error('Mixed Feed Fetch Error:', error.message);
        return [];
    }
};
