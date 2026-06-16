const pool = require('../db/pool');
const { validationResult } = require('express-validator');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

// GET /students/:studentId/marks
const getMarksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const studentCheck = await pool.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const result = await pool.query(
      `SELECT m.*, sub.name AS subject_name, sub.code AS subject_code
       FROM marks m
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.student_id = $1
       ORDER BY m.exam_date DESC`,
      [studentId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getMarksByStudent:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /students/:studentId/marks
const addMark = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { studentId } = req.params;
    const { subject_id, marks, max_marks, exam_type, exam_date } = req.body;

    const studentCheck = await pool.query('SELECT id FROM students WHERE id = $1', [studentId]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const subjectCheck = await pool.query('SELECT id FROM subjects WHERE id = $1', [subject_id]);
    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const result = await pool.query(
      `INSERT INTO marks (student_id, subject_id, marks, max_marks, exam_type, exam_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [studentId, subject_id, marks, max_marks || 100, exam_type || 'Midterm', exam_date || new Date()]
    );

    // Fetch with subject name
    const full = await pool.query(
      `SELECT m.*, sub.name AS subject_name, sub.code AS subject_code
       FROM marks m JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ success: true, data: full.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Mark already exists for this student/subject/exam combination',
      });
    }
    console.error('addMark:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /marks/:id
const updateMark = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { id } = req.params;
    const { marks, max_marks, exam_type, exam_date } = req.body;

    const result = await pool.query(
      `UPDATE marks
       SET marks     = COALESCE($1, marks),
           max_marks = COALESCE($2, max_marks),
           exam_type = COALESCE($3, exam_type),
           exam_date = COALESCE($4, exam_date)
       WHERE id = $5
       RETURNING *`,
      [marks, max_marks, exam_type, exam_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mark record not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateMark:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /marks/:id
const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM marks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mark record not found' });
    }

    res.json({ success: true, message: 'Mark deleted successfully' });
  } catch (err) {
    console.error('deleteMark:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /subjects
const getSubjects = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getSubjects:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getMarksByStudent, addMark, updateMark, deleteMark, getSubjects };
