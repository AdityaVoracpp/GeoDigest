const mongoose = require('mongoose');
const { Favorite } = require('../models/Favorite');
const { answerFromFavorites, generateEmbedding } = require('../services/aiService');

const TOP_K = 5; // Number of most-relevant articles to retrieve

/**
 * POST /api/users/ask
 * Body: { question: string }
 * Requires JWT auth (req.userId is set by auth middleware).
 *
 * 1. Generates an embedding for the user's question.
 * 2. Runs a MongoDB Atlas Vector Search to find the top-K most relevant favorites.
 * 3. Passes only those articles to the AI for answering.
 */
async function askAboutFavorites(req, res, next) {
  const { question, history = [] } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ msg: 'question field is required' });
  }

  try {
    // Count total favorites for this user
    const totalFavorites = await Favorite.countDocuments({ userId: req.userId });
    
    if (totalFavorites === 0) {
      return res.json({
        answer: 'You have no saved articles to ask questions about. Save some articles first!',
        sourcesUsed: [],
        totalFavorites: 0,
        articlesSearched: 0,
      });
    }

    // Cheap contextualization: prepend the last user question to improve
    // embedding quality for vague follow-ups (e.g. "what about the other one?")
    // without burning an extra LLM call to rewrite the query.
    const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
    const textToEmbed = lastUserMsg
      ? `${lastUserMsg.text} ${question.trim()}`
      : question.trim();

    // Generate embedding for the (contextualized) question
    const questionEmbedding = await generateEmbedding(textToEmbed);
    console.log(`[rag] Generated question embedding (${questionEmbedding.length}d)`);

    // Perform MongoDB Atlas Vector Search
    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    
    let relevantArticles;
    try {
      relevantArticles = await Favorite.aggregate([
        {
          $vectorSearch: {
            index: 'favorite_embedding_index',
            path: 'embedding',
            queryVector: questionEmbedding,
            numCandidates: Math.min(totalFavorites, 100),
            limit: TOP_K,
            filter: { userId: userObjectId },
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            url: 1,
            source: 1,
            summary: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);
      console.log(`[rag] Vector search returned ${relevantArticles.length} articles`);
      relevantArticles.forEach((a, i) =>
        console.log(`  [${i + 1}] score=${a.score?.toFixed(4)} — "${a.title?.substring(0, 60)}"`)
      );
    } catch (searchErr) {
      // Fallback: if vector search index doesn't exist yet, fall back to fetching all
      console.warn(`[rag] Vector search FAILED, falling back to full scan: ${searchErr.message}`);
      relevantArticles = await Favorite.find({ userId: req.userId })
        .select('title description url source summary')
        .sort({ savedAt: -1 })
        .limit(TOP_K)
        .lean();
    }

    if (!relevantArticles || relevantArticles.length === 0) {
      return res.json({
        answer: 'No relevant articles found in your favorites.',
        sourcesUsed: [],
        totalFavorites,
        articlesSearched: 0,
      });
    }

    // Send relevant articles + conversation history to the AI
    const result = await answerFromFavorites(question.trim(), relevantArticles, history);

    res.json({
      answer: result.answer,
      sourcesUsed: result.sourcesUsed,
      totalFavorites,
      articlesSearched: relevantArticles.length,
    });
  } catch (err) {
    console.error('[rag] UNCAUGHT ERROR:', err.message);
    console.error('[rag] Stack:', err.stack);
    next(err);
  }
}

module.exports = { askAboutFavorites };
