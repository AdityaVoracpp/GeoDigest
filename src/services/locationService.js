const fs = require('fs');
const path = require('path');

// Load once at module startup — avoids repeated disk reads per request
const cities = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../cities.json'), 'utf-8')
);
const countries = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../countries.json'), 'utf-8')
);

/**
 * Attempts to find a geographic coordinate from article text by
 * matching city names first, then country names.
 *
 * @param {string} text - Combined article text to search within.
 * @returns {{ match: string|null, type: string, lat: number, lon: number }}
 */
function findLocation(text) {
  // Skip short city names to avoid false-positive matches
  for (const city of cities) {
    if (city.city.length < 5) continue;
    if (text.includes(city.city)) {
      return {
        match: city.city,
        type: 'city',
        lat: city.latitude,
        lon: city.longitude,
      };
    }
  }

  for (const country of countries) {
    if (text.includes(country.name)) {
      return {
        match: country.name,
        type: 'country',
        lat: country.latitude,
        lon: country.longitude,
      };
    }
  }

  // Fallback — place in the Pacific Ocean away from landmasses
  return { match: null, type: 'none', lat: 0, lon: -160 };
}

/**
 * Small random jitter applied to lat/lon so markers don't stack exactly.
 * @returns {number}
 */
function jitter() {
  return (Math.random() - 0.5) * 0.1;
}

module.exports = { findLocation, jitter };
