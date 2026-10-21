
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const voteRoutes = require('./routes/voteRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
  next();
});
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '16kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/votes', voteRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SecureVote backend is running',
  });
});

app.get('/api/db-status', (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? 'connected' : 'disconnected',
    name: mongoose.connection.name || null,
  });
});

app.use(errorMiddleware);

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`SecureVote backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start SecureVote:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };