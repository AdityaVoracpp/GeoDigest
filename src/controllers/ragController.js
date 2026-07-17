const User = require('../models/User');
const { answerFromFavorites } = require('../services/aiService');

/**
 * POST /api/users/ask
 * Body: { question: string }
 * Requires JWT auth (req.userId is set by auth middleware).
 */
async function askAboutFavorites(req, res, next) {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ msg: 'question field is required' });
  }

  try {
    const user = await User.findById(req.userId).select('favorites');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const result = await answerFromFavorites(question.trim(), user.favorites);

    res.json({
      answer: result.answer,
      sourcesUsed: result.sourcesUsed,
      totalFavorites: user.favorites.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { askAboutFavorites };
