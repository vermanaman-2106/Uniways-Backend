import express from 'express';
import facultyRoutes from './faculty.js';
import authRoutes from './auth.js';
import appointmentRoutes from './appointments.js';
import complaintRoutes from './complaints.js';
import timetableRoutes from './timetable.js';

// ✅ FIXED IMPORTS
import classroomRoutes from './classroom.js';
import assignmentRoutes from './assignment.js';
import submissionRoutes from './submission.js';
import attendanceRoutes from './attendance.js';
import userRoutes from './users.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Test route is working!' });
});

// Existing routes
  router.use('/auth', authRoutes);
router.use('/faculty', facultyRoutes);
  router.use('/appointments', appointmentRoutes);
  router.use('/complaints', complaintRoutes);
router.use('/timetable', timetableRoutes);

// ✅ New routes
router.use('/classroom', classroomRoutes);
router.use('/assignment', assignmentRoutes);
router.use('/submission', submissionRoutes);
        router.use('/attendance', attendanceRoutes);
router.use('/users', userRoutes);

  export default router;