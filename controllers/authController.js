import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-this', {
    expiresIn: '30d',
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    // Validate email domain
    const validDomains = ['@muj.manipal.edu', '@jaipur.manipal.edu'];
    const emailDomain = email.toLowerCase().split('@')[1];
    if (!emailDomain || !validDomains.includes(`@${emailDomain}`)) {
      return res.status(400).json({
        success: false,
        message: 'Email must be a college email (@muj.manipal.edu or @jaipur.manipal.edu)',
      });
    }

    // Validate role
    if (!['faculty', 'student'].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "faculty" or "student"',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role.toLowerCase(),
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset token has been sent.',
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send reset email
      console.log(`📧 Attempting to send password reset email to: ${user.email}`);
      await sendPasswordResetEmail(user.email, resetToken);
      
      console.log(`✅ Password reset email sent successfully to: ${user.email}`);
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox and spam folder.',
      });
    } catch (emailError) {
      // Log the email error
      console.error('❌ Error sending password reset email:', emailError.message);
      console.error('Full error:', emailError);
      
      // For development: return token if email fails so user can still reset
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Development mode: Returning token in response since email failed');
        res.status(200).json({
          success: true,
          message: 'Email sending failed. Use this token for development:',
          data: {
            resetToken,
            error: emailError.message || 'Email could not be sent. Check email configuration.',
            note: 'In production, this token would not be returned.',
          },
        });
      } else {
        // In production, don't expose the token even if email fails
        res.status(200).json({
          success: true,
          message: 'If that email exists, a password reset email has been sent. Please check your inbox and spam folder.',
        });
      }
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message,
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token for automatic login
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        token,
      },
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

