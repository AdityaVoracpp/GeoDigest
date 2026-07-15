const { Router } = require('express');
const { getNews } = require('../controllers/newsController');

const router = Router();

// POST /api/news
router.post('/', getNews);

module.exports = router;
