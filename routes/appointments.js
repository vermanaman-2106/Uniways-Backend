import express from 'express';
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getPendingAppointments,
  getFacultyList,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get faculty list (for students to select)
router.get('/faculty', getFacultyList);

// Get pending appointments (faculty only)
router.get('/pending', getPendingAppointments);

// Get my appointments
router.get('/my-appointments', getMyAppointments);

// Get single appointment
router.get('/:id', getAppointmentById);

// Create appointment (student only)
router.post('/', createAppointment);

// Update appointment status
router.put('/:id/status', updateAppointmentStatus);

export default router;

