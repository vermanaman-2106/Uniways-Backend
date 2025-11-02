import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', protect, getMe);

// POST /api/auth/forgot-password - Forgot password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', resetPassword);

export default router;

