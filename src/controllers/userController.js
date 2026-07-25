const User = require('../models/User');
const { Favorite } = require('../models/Favorite');
const { generateEmbedding } = require('../services/aiService');

const MAX_FAVORITES = 100;

async function getFavorites(req, res, next) {
  try {
    const favorites = await Favorite.find({ userId: req.userId })
      .select('-embedding')  // Don't send the large embedding array to the client
      .sort({ savedAt: -1 });

    res.status(200).json({ favorites });
  } catch (err) {
    next(err);
  }
}

async function addFavorite(req, res, next) {
  try {
    const { title, description, url, image_url, source, categories, location, lat, lon, senti, summary } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({ msg: 'title and url are required' });
    }
    
    // Check if user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check for duplicates
    const alreadySaved = await Favorite.findOne({ userId: req.userId, url });
    if (alreadySaved) {
      return res.status(409).json({ msg: 'Article already in favorites' });
    }

    // Check the 100-article limit
    const count = await Favorite.countDocuments({ userId: req.userId });
    if (count >= MAX_FAVORITES) {
      return res.status(400).json({ msg: `Favorites limit reached (max ${MAX_FAVORITES})` });
    }

    // Generate embedding from the article text
    const textToEmbed = `${title} ${summary || description || ''}`.trim();
    let embedding = [];
    try {
      embedding = await generateEmbedding(textToEmbed);
      console.log(`[vector] Generated embedding for "${title.substring(0, 40)}..." (${embedding.length}d)`);
    } catch (embErr) {
      console.warn(`[vector] Embedding generation failed, saving without: ${embErr.message}`);
    }

    const favorite = await Favorite.create({
      userId: req.userId,
      title, description, url, image_url, source, categories, location, lat, lon, senti, summary,
      embedding,
    });

    // Return without the embedding field (it's large and not useful for the client)
    const result = favorite.toObject();
    delete result.embedding;

    res.status(201).json({ msg: 'Article added to favorites', article: result });
  } catch (err) {
    next(err);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const { articleId } = req.params;
    
    const deleted = await Favorite.findOneAndDelete({ _id: articleId, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ msg: 'Favorite article not found' });
    }
    
    res.status(200).json({ msg: 'Article removed from favorites' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite };
