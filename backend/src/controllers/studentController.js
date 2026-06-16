const pool = require('../db/pool');
const { validationResult } = require('express-validator');

// ── helpers ─────────────────────────────────────────────────
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

// ── GET /students?page=1&limit=10 ───────────────────────────
const getStudents = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    let countQuery = 'SELECT COUNT(*) FROM students';
    let dataQuery  = `
      SELECT s.*, 
             ROUND(AVG(m.marks), 2)       AS avg_marks,
             COUNT(m.id)::int             AS total_marks_entries
      FROM students s
      LEFT JOIN marks m ON m.student_id = s.id
    `;
    const params = [];

    if (search) {
      const where = ` WHERE (s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR s.email ILIKE $1)`;
      countQuery += where;
      dataQuery  += where;
      params.push(search);
    }

    dataQuery += `
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countQuery, search ? [search] : []),
      pool.query(dataQuery, [...params, limit, offset]),
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('getStudents:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── GET /students/:id ────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const studentRes = await pool.query(
      'SELECT * FROM students WHERE id = $1',
      [id]
    );
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const marksRes = await pool.query(
      `SELECT m.*, sub.name AS subject_name, sub.code AS subject_code
       FROM marks m
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.student_id = $1
       ORDER BY m.exam_date DESC`,
      [id]
    );

    res.json({
      success: true,
      data: { ...studentRes.rows[0], marks: marksRes.rows },
    });
  } catch (err) {
    console.error('getStudentById:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── POST /students ───────────────────────────────────────────
const createStudent = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { first_name, last_name, email, phone, date_of_birth, enrollment_date } = req.body;

    const existing = await pool.query('SELECT id FROM students WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const result = await pool.query(
      `INSERT INTO students (first_name, last_name, email, phone, date_of_birth, enrollment_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [first_name, last_name, email, phone || null, date_of_birth || null, enrollment_date || new Date()]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createStudent:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── PUT /students/:id ────────────────────────────────────────
const updateStudent = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, date_of_birth, enrollment_date } = req.body;

    const existing = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM students WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already in use by another student' });
      }
    }

    const result = await pool.query(
      `UPDATE students
       SET first_name       = COALESCE($1, first_name),
           last_name        = COALESCE($2, last_name),
           email            = COALESCE($3, email),
           phone            = COALESCE($4, phone),
           date_of_birth    = COALESCE($5, date_of_birth),
           enrollment_date  = COALESCE($6, enrollment_date)
       WHERE id = $7
       RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth, enrollment_date, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateStudent:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── DELETE /students/:id ─────────────────────────────────────
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    console.error('deleteStudent:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
