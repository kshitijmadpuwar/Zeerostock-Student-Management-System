const express = require('express');
const { body, param } = require('express-validator');
const {
  getMarksByStudent, addMark, updateMark, deleteMark, getSubjects,
} = require('../controllers/marksController');

const router = express.Router({ mergeParams: true });

const markValidation = [
  body('subject_id').isInt({ min: 1 }).withMessage('Valid subject ID is required'),
  body('marks').isFloat({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100'),
  body('max_marks').optional().isFloat({ min: 1 }).withMessage('Max marks must be positive'),
  body('exam_type').optional().trim().notEmpty(),
  body('exam_date').optional().isDate().withMessage('Invalid exam date'),
];

// Nested under /students/:studentId/marks
router.get('/',  getMarksByStudent);
router.post('/', markValidation, addMark);

module.exports = router;
