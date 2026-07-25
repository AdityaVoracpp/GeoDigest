const { createClient } = require('redis');
const { REDIS_URL } = require('../config/env');

let client = null;
let isReady = false;

async function initRedis() {
  try {
    client = createClient({ 
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) return false;
          return Math.min(retries * 200, 2000);
        }
      }
    });

    client.on('error', (err) => {
      console.error('[redis] Error:', err.message);
      isReady = false;
    });

    client.on('ready', () => {
      console.log('[redis] Connected successfully to Docker Redis');
      isReady = true;
    });

    client.on('end', () => {
      console.log('[redis] Disconnected');
      isReady = false;
    });

    await client.connect();
  } catch (err) {
    console.error('[redis] Failed to connect:', err.message);
    isReady = false;
  }
}

async function cacheGet(key) {
  if (!isReady || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[redis] GET error:', err.message);
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 600) {
  if (!isReady || !client) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error('[redis] SET error:', err.message);
  }
}

module.exports = { initRedis, cacheGet, cacheSet };
