// Load and validate env vars before anything else
const { PORT } = require('./src/config/env');
const connectDB = require('./src/config/db');
const { initRedis } = require('./src/services/cacheService');
const app = require('./src/app');

connectDB().then(async () => {
  await initRedis();
  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
  });
});
