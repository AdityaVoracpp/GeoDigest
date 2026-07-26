const express = require('express');
const cors = require('cors');
const path = require('path');

const newsRoutes = require('./routes/newsRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static Frontend ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/news', newsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ── SPA Fallback ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
