// Load and validate env vars before anything else
const { PORT } = require('./src/config/env');
const app = require('./src/app');

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});
