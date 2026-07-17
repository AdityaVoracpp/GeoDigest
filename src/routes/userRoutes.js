const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/userController');
const { askAboutFavorites } = require('../controllers/ragController');

const router = Router();

// All routes in this file require authentication
router.use(authMiddleware);

// GET /api/users/favorites
router.get('/favorites', getFavorites);

// POST /api/users/favorites
router.post('/favorites', addFavorite);

// DELETE /api/users/favorites/:articleId
router.delete('/favorites/:articleId', removeFavorite);

// POST /api/users/ask
router.post('/ask', askAboutFavorites);

module.exports = router;
