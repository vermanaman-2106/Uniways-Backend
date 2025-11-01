import express from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
} from '../controllers/facultyController.js';

const router = express.Router();

// GET /api/faculty - Get all faculty
router.get('/', getAllFaculty);

// GET /api/faculty/:id - Get single faculty member
router.get('/:id', getFacultyById);

// POST /api/faculty - Create new faculty member
router.post('/', createFaculty);

export default router;

