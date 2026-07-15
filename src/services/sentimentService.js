const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();

/**
 * Returns a sentiment value for a given text.
 * @param {string} text
 * @returns {1 | 0 | -1}  1 = positive, 0 = neutral, -1 = negative
 */
function getScore(text) {
  const result = sentimentAnalyzer.analyze(text);
  const score = result.score;

  if (score > 2) return 1;
  if (score < -2) return -1;
  return 0;
}

module.exports = { getScore };
