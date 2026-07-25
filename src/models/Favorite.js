const mongoose = require('mongoose');

const EMBEDDING_DIMENSIONS = 768; // text-embedding-004 outputs 768-d vectors

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  url:         { type: String, required: true },
  image_url:   { type: String, default: null },
  source:      { type: String, default: 'Unknown' },
  categories:  { type: [String], default: [] },
  location:    { type: String, default: null },
  lat:         { type: Number, default: 0 },
  lon:         { type: Number, default: 0 },
  senti:       { type: Number, default: 0 },
  summary:     { type: String, default: '' },
  savedAt:     { type: Date, default: Date.now },

  // Vector embedding for semantic search (768-d from text-embedding-004)
  embedding:   { type: [Number], default: [] },
});

// Compound index to quickly check duplicates per user
favoriteSchema.index({ userId: 1, url: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = { Favorite, EMBEDDING_DIMENSIONS };
