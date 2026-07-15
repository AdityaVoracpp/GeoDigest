const axios = require('axios');
const { NEWS_API_KEY } = require('../config/env');

const NEWS_BASE_URL = 'https://api.thenewsapi.com/v1/news/all';
const DEFAULT_LIMIT = 3;

/**
 * Fetches news articles from thenewsapi.com for a given query.
 * @param {string} query - Search term.
 * @param {number} [limit] - Max number of articles to return.
 * @returns {Promise<Object[]>} Raw article objects from the API.
 */
async function fetchArticles(query, limit = DEFAULT_LIMIT) {
  const response = await axios.get(NEWS_BASE_URL, {
    params: {
      api_token: NEWS_API_KEY,
      search: query,
      language: 'en',
      limit,
    },
  });
  return response.data.data;
}

module.exports = { fetchArticles };
