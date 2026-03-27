import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  addTimetableEntry,
  getFacultyTimetable,
  updateTimetableEntry,
  deleteTimetableEntry,
  getAvailableSlotsForFacultyDay,
} from '../controllers/timetableController.js';

const router = express.Router();

// All timetable routes are protected.
router.use(protect);

// POST /api/timetable/add
router.post('/add', addTimetableEntry);

// GET /api/timetable/
router.get('/', getFacultyTimetable);

// Bonus: GET /api/timetable/available?day=Monday&slotDurationMinutes=30
router.get('/available', getAvailableSlotsForFacultyDay);

// PUT /api/timetable/:id
router.put('/:id', updateTimetableEntry);

// DELETE /api/timetable/:id
router.delete('/:id', deleteTimetableEntry);

export default router;

