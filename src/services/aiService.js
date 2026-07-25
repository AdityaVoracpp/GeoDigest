const { GoogleGenAI } = require('@google/genai');
const { AI_API_KEY } = require('../config/env');

const ai = new GoogleGenAI({ apiKey: AI_API_KEY });

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite', // 500 RPD limit
  'gemini-3.1-flash-lite', // 500 RPD limit
  'gemini-3.6-flash',      // 20 RPD limit
  'gemini-3.5-flash',      // 20 RPD limit
  'gemini-3-flash',        // 20 RPD limit
  'gemini-2.5-flash'       // 20 RPD limit
];

/**
 * Helper to call generateContent with automatic model fallback on 429/Resource Exhausted.
 */
async function generateContentWithFallback(requestOptions) {
  let lastError;
  for (const model of FALLBACK_MODELS) {
    try {
      const options = { ...requestOptions, model };
      console.log(`[ai] Attempting with model: ${model}`);
      const response = await ai.models.generateContent(options);
      return response;
    } catch (err) {
      lastError = err;
      const isRateLimit = err.status === 'RESOURCE_EXHAUSTED' || 
                          (err.message && err.message.includes('429')) ||
                          err.code === 429;
      
      if (isRateLimit) {
        console.warn(`[ai] Model ${model} rate limited. Trying next model...`);
        continue;
      }
      
      console.error(`[ai] Error with model ${model} (not a rate limit). Aborting fallback.`);
      throw err;
    }
  }
  
  console.error('[ai] Exhausted all fallback models due to rate limits.');
  throw lastError;
}

/**
 * Summarizes a piece of news text using the Gemini model.
 * @param {string} txt - The raw article text to summarize.
 * @returns {Promise<string>} AI-generated summary string.
 */
async function summarize(txt) {
  const response = await generateContentWithFallback({
    contents:
      'Summarize and give some opinion/inference from the following news under 100 words: ' + txt,
  });
  return response.text;
}

/**
 * Analyzes a batch of news articles.
 * @param {Array} articles
 * @returns {Promise<Array>}
 */
async function analyzeArticlesBatch(articles) {
  const prompt = `Analyze the following news articles and extract a summary, city, and country for each.
Return as a JSON array of objects: { index, summary, city, country }.
Articles: ${JSON.stringify(articles)}`;

  const response = await generateContentWithFallback({
    contents: prompt,
  });

  try {
    return JSON.parse(response.text);
  } catch (err) {
    console.error('Failed to parse AI batch structured response:', response.text, err);
    return articles.map((art, idx) => ({
      index: idx,
      summary: art.description || art.title,
      city: null,
      country: null,
    }));
  }
}

/**
 * Generates a 768-d vector embedding for the given text using Google's gemini-embedding-001.
 * @param {string} text - The text to embed (e.g. article title + summary).
 * @returns {Promise<number[]>} 768-dimensional embedding array.
 */
async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: {
      outputDimensionality: 768
    }
  });

  return result.embeddings[0].values;
}

/**
 * Answers a user's question using their saved favorite articles as context.
 * Supports multi-turn conversation via an optional history array.
 * @param {string} question - The user's current question.
 * @param {Array<{title: string, description: string, summary: string, source: string, url: string}>} articles
 * @param {Array<{role: 'user'|'model', text: string}>} [history=[]] - Previous conversation turns.
 * @returns {Promise<{answer: string, sourcesUsed: string[]}>}
 */
async function answerFromFavorites(question, articles, history = []) {
  if (!articles || articles.length === 0) {
    return {
      answer: 'You have no saved articles to ask questions about. Save some articles first!',
      sourcesUsed: [],
    };
  }

  const formattedArticles = articles
    .map(
      (art, idx) => `[Article ${idx + 1}]
Title: ${art.title}
Source: ${art.source || 'Unknown'}
Summary: ${art.summary || art.description || 'No summary available'}
URL: ${art.url}`
    )
    .join('\n---\n');

  // Build multi-turn contents array from history (cap at last 6 messages)
  const MAX_HISTORY = 6;
  const recentHistory = history.slice(-MAX_HISTORY);

  const contents = recentHistory.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));

  // Append the current question as the latest user turn
  contents.push({ role: 'user', parts: [{ text: question }] });

  const response = await generateContentWithFallback({
    config: {
      responseMimeType: 'application/json',
      systemInstruction: `You are a helpful news research assistant. The user has saved the following news articles as favorites. These are the articles most relevant to the user's question, found via semantic search. Answer their question using ONLY the information from these articles. If the answer cannot be found in the articles, say "I couldn't find information about that in your saved articles."

Always cite which article(s) you used by their number (e.g., [Article 1], [Article 3]).

Respond with a JSON object with keys "answer" (string) and "sourcesUsed" (array of 1-based article index numbers).

RELEVANT SAVED ARTICLES:
${formattedArticles}`
    },
    contents,
  });

  console.log('[ai] Raw model output:', response.text);

  try {
    const parsed = JSON.parse(response.text);
    // If the model didn't use the exact 'answer' key, try to salvage the response
    if (!parsed.answer) {
      if (parsed.response) parsed.answer = parsed.response;
      else if (parsed.text) parsed.answer = parsed.text;
      else if (parsed.message) parsed.answer = parsed.message;
      else parsed.answer = JSON.stringify(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('[ai] Failed to parse RAG response:', err.message, response.text);
    return { answer: 'Sorry, I could not generate an answer.', sourcesUsed: [] };
  }
}

module.exports = { summarize, analyzeArticlesBatch, generateEmbedding, answerFromFavorites };
