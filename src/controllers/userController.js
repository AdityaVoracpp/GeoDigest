const User = require('../models/User');

async function getFavorites(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('favorites');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(200).json({ favorites: user.favorites });
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
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const alreadySaved = user.favorites.some(fav => fav.url === url);
    if (alreadySaved) {
      return res.status(409).json({ msg: 'Article already in favorites' });
    }
    
    user.favorites.push({ title, description, url, image_url, source, categories, location, lat, lon, senti, summary });
    await user.save();
    
    res.status(201).json({ msg: 'Article added to favorites', article: user.favorites[user.favorites.length - 1] });
  } catch (err) {
    next(err);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const { articleId } = req.params;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const article = user.favorites.id(articleId);
    if (!article) {
      return res.status(404).json({ msg: 'Favorite article not found' });
    }
    
    article.deleteOne();
    await user.save();
    
    res.status(200).json({ msg: 'Article removed from favorites' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFavorites, addFavorite, removeFavorite };
