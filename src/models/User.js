const mongoose = require('mongoose');

const favoriteArticleSchema = new mongoose.Schema({
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
});

const userSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:  { type: String, required: true },
  favorites: [favoriteArticleSchema],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
