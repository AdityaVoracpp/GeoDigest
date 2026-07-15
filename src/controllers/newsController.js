const { fetchArticles } = require('../services/newsService');
const { findLocation, jitter } = require('../services/locationService');
const { getScore } = require('../services/sentimentService');
const { summarize } = require('../services/aiService');

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
        const summary = await summarize(aiRaw);

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

    res.json(enriched);
  } catch (err) {
    next(err); // Delegate to global error handler
  }
}

module.exports = { getNews };
