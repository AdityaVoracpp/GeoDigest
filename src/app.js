const express = require('express');
const cors = require('cors');
const path = require('path');

const newsRoutes = require('./routes/newsRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static Frontend ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/news', newsRoutes);

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
