require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const studentRoutes = require('./routes/students');
const marksRoutes = require('./routes/marks');
const { updateMark, deleteMark, getSubjects } = require('./controllers/marksController');
const { body, param } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/students', studentRoutes);
app.use('/api/students/:studentId/marks', marksRoutes);
app.get('/api/subjects', getSubjects);

// Stand-alone mark update / delete
app.put('/api/marks/:id', [
  param('id').isInt({ min: 1 }),
  body('marks').optional().isFloat({ min: 0, max: 100 }),
  body('max_marks').optional().isFloat({ min: 1 }),
], updateMark);

app.delete('/api/marks/:id', param('id').isInt({ min: 1 }), deleteMark);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
