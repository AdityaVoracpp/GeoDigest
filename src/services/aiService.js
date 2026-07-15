const { GoogleGenAI } = require('@google/genai');
const { AI_API_KEY } = require('../config/env');

const ai = new GoogleGenAI({ apiKey: AI_API_KEY });

/**
 * Summarizes a piece of news text using the Gemini model.
 * @param {string} txt - The raw article text to summarize.
 * @returns {Promise<string>} AI-generated summary string.
 */
async function summarize(txt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents:
      'Summarize and give some opinion/inference from the following news under 100 words: ' + txt,
  });
  return response.text;
}

module.exports = { summarize };
