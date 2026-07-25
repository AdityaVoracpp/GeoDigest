const crypto = require('crypto');
const { fetchArticles } = require('../services/newsService');
const { findLocation, jitter } = require('../services/locationService');
const { getScore } = require('../services/sentimentService');
const { summarize } = require('../services/aiService');
const { cacheGet, cacheSet } = require('../services/cacheService');

/**
 * Helper to generate a consistent hash for a string
 */
function generateHash(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * POST /api/news
 * Body: { query: string }
 *
 * Fetches articles, enriches each with location, sentiment, and an AI summary,
 * then returns the array as JSON.
 */
async function getNews(req, res, next) {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ msg: 'query field cannot be empty' });
    }

    try {
        const cacheKey = `news:${query.toLowerCase().trim()}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
            console.log(`[cache] HIT for "${cacheKey}"`);
            return res.json(cached);
        }

        const rawArticles = await fetchArticles(query);

        if (!rawArticles || rawArticles.length === 0) {
            return res.json([]);
        }

        const enriched = await Promise.all(
            rawArticles.map(async (article) => {
                // Normalize nullish fields so string operations don't throw
                const title = article.title || '';
                const description = article.description || '';
                const keywords = article.keywords || '';
                const snippet = article.snippet || '';

                const text = `${title} ${description} ${keywords} ${snippet}`;
                const aiRaw = `${title} ${description}`;

                const location = findLocation(text);
                const senti = getScore(text);
                
                // Summarize with cache
                let summary = '';
                if (aiRaw.trim()) {
                    const articleHash = generateHash(aiRaw);
                    const aiCacheKey = `ai:summary:${articleHash}`;
                    
                    const cachedSummary = await cacheGet(aiCacheKey);
                    if (cachedSummary) {
                        console.log(`[cache] HIT for "${aiCacheKey}"`);
                        summary = cachedSummary;
                    } else {
                        try {
                            console.log(`[cache] MISS for "${aiCacheKey}"`);
                            summary = await summarize(aiRaw);
                            // Cache AI summary for 7 days (604800s) since news text doesn't change
                            if (summary) {
                                await cacheSet(aiCacheKey, summary, 604800);
                            }
                        } catch (aiErr) {
                            console.warn(`[ai] summarize skipped: ${aiErr.message}`);
                        }
                    }
                }

                const offset = jitter();

                return {
                    title,
                    description,
                    url: article.url,
                    image_url: article.image_url,
                    source: article.source,
                    categories: article.categories,
                    location: location.match,
                    location_type: location.type,
                    lat: location.lat + offset,
                    lon: location.lon + offset,
                    senti,
                    summary,
                };
            })
        );

        // Cache the final enriched result for 1 hour (3600 seconds)
        await cacheSet(cacheKey, enriched, 3600);
        console.log(`[cache] MISS — stored "${cacheKey}" (TTL 3600s)`);

        res.json(enriched);
    } catch (err) {
        next(err); // Delegate to global error handler
    }
}

module.exports = { getNews };
