import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Create complaint (Student and Faculty)
router.post('/', createComplaint);

// Get my complaints
router.get('/my-complaints', getMyComplaints);

// Get all complaints (for admin/staff view)
router.get('/all', getAllComplaints);

// Get single complaint
router.get('/:id', getComplaintById);

// Update complaint status (Admin/Staff)
router.put('/:id/status', updateComplaintStatus);

// Delete complaint
router.delete('/:id', deleteComplaint);

export default router;

