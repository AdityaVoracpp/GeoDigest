require('dotenv').config();

const required = ['aiapi', 'newsapi', 'MONGODB_URI', 'JWT_SECRET'];

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
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};
