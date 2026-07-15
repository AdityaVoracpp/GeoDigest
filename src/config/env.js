require('dotenv').config();

const required = ['aiapi', 'newsapi'];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  PORT: process.env.PORT || 3000,
  AI_API_KEY: process.env.aiapi,
  NEWS_API_KEY: process.env.newsapi,
};
