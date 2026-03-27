import express from 'express';
import facultyRoutes from './faculty.js';
import authRoutes from './auth.js';
import appointmentRoutes from './appointments.js';
import complaintRoutes from './complaints.js';
import timetableRoutes from './timetable.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// Example route - you can add more routes here
router.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

// Authentication routes
router.use('/auth', authRoutes);

// Faculty routes
router.use('/faculty', facultyRoutes);

// Appointment routes
router.use('/appointments', appointmentRoutes);

// Complaint routes
router.use('/complaints', complaintRoutes);

// Timetable routes
router.use('/timetable', timetableRoutes);

export default router;

