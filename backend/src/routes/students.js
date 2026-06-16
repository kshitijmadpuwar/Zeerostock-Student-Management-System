const express = require('express');
const { body, param } = require('express-validator');
const {
  getStudents, getStudentById,
  createStudent, updateStudent, deleteStudent,
} = require('../controllers/studentController');

const router = express.Router();

const studentValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number'),
  body('date_of_birth').optional().isDate().withMessage('Invalid date of birth'),
  body('enrollment_date').optional().isDate().withMessage('Invalid enrollment date'),
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid student ID'),
  body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number'),
];

router.get('/',       getStudents);
router.get('/:id',    param('id').isInt({ min: 1 }), getStudentById);
router.post('/',      studentValidation, createStudent);
router.put('/:id',    updateValidation, updateStudent);
router.delete('/:id', param('id').isInt({ min: 1 }), deleteStudent);

module.exports = router;
