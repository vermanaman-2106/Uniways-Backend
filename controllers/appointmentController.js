import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import FacultyProfile from '../models/Faculty.js';
import { sendAppointmentNotificationEmail, sendAppointmentStatusEmail } from '../utils/sendEmail.js';

// Create appointment (Student only)
export const createAppointment = async (req, res) => {
  try {
    const { facultyId, date, time, duration, reason } = req.body;
    const studentId = req.user.id;

    // Validate input
    if (!facultyId || !date || !time || !duration || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can create appointments',
      });
    }

    // First, try to find faculty in FacultyProfile (from frontend)
    let facultyProfile = null;
    let facultyUser = null;

    try {
      facultyProfile = await FacultyProfile.findById(facultyId);
      console.log('FacultyProfile found:', facultyProfile ? facultyProfile.name : 'Not found');
    } catch (err) {
      console.log('Error finding FacultyProfile:', err.message);
      // If not found in FacultyProfile, try User collection directly
    }

    // If found in FacultyProfile, find corresponding User by email
    if (facultyProfile) {
      console.log('Looking for User with email:', facultyProfile.email);
      facultyUser = await User.findOne({ 
        email: facultyProfile.email.toLowerCase().trim(),
        role: 'faculty' 
      });
      
      if (!facultyUser) {
        console.log('Faculty User not found for email:', facultyProfile.email);
        return res.status(404).json({
          success: false,
          message: `Faculty member "${facultyProfile.name}" is not registered in the system. Please ask them to sign up with email: ${facultyProfile.email}`,
        });
      }
      console.log('Faculty User found:', facultyUser.name);
    } else {
      // If not found in FacultyProfile, try User collection directly
      console.log('FacultyProfile not found, trying User collection directly with ID:', facultyId);
      facultyUser = await User.findById(facultyId);
      if (!facultyUser || facultyUser.role !== 'faculty') {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found. Please ensure the faculty member has signed up in the app.',
        });
      }
    }

    // Check for double booking (same faculty, date, time)
    const existingAppointment = await Appointment.findOne({
      facultyId: facultyUser._id,
      date: new Date(date),
      time,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked',
      });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(date);
    const now = new Date();
    if (appointmentDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments in the past',
      });
    }

    // Create appointment using User ID
    const appointment = await Appointment.create({
      studentId,
      facultyId: facultyUser._id,
      date: appointmentDate,
      time,
      duration,
      reason,
      status: 'pending',
    });

    // Populate student and faculty details
    await appointment.populate('studentId', 'name email');
    await appointment.populate('facultyId', 'name email department');

    // Send notification email to faculty in background (fire-and-forget)
    if (appointment.facultyId?.email) {
      sendAppointmentNotificationEmail({
        toEmail: appointment.facultyId.email,
        facultyName: appointment.facultyId.name,
        studentName: appointment.studentId.name,
        studentEmail: appointment.studentId.email,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        reason: appointment.reason,
      }).catch((emailErr) => {
        console.warn('Failed to send appointment notification email:', emailErr?.message || emailErr);
      });
    } else {
      console.warn('Faculty email missing; skipping email notification');
    }

    res.status(201).json({
      success: true,
      message: 'Appointment requested successfully',
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message,
    });
  }
};

// Get all appointments for current user
export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, role } = req.query;

    let query = {};
    
    if (req.user.role === 'student') {
      query.studentId = userId;
    } else if (req.user.role === 'faculty') {
      query.facultyId = userId;
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('studentId', 'name email')
      .populate('facultyId', 'name email department designation')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message,
    });
  }
};

// Get single appointment
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('facultyId', 'name email department designation');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check if user has permission to view this appointment
    const userId = req.user.id;
    if (
      appointment.studentId._id.toString() !== userId &&
      appointment.facultyId._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment',
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message,
    });
  }
};

// Update appointment status (Faculty only for approve/reject)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use: approved, rejected, or cancelled',
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check permissions
    if (status === 'approved' || status === 'rejected') {
      // Only faculty can approve/reject
      if (appointment.facultyId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only faculty can approve or reject appointments',
        });
      }

      // Check if faculty exists in FacultyProfile collection
      const facultyUser = await User.findById(userId);
      if (!facultyUser || facultyUser.role !== 'faculty') {
        return res.status(403).json({
          success: false,
          message: 'Only faculty members can approve or reject appointments',
        });
      }

      // Verify faculty exists in FacultyProfile collection
      const facultyProfile = await FacultyProfile.findOne({ 
        email: facultyUser.email.toLowerCase().trim() 
      });

      if (!facultyProfile) {
        return res.status(403).json({
          success: false,
          message: 'Only faculty members registered in the Faculty Profile can approve appointments. Please contact the administrator.',
        });
      }
    } else if (status === 'cancelled') {
      // Both student and faculty can cancel
      if (
        appointment.studentId.toString() !== userId &&
        appointment.facultyId.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this appointment',
        });
      }
    }

    // Update appointment
    appointment.status = status;
    if (req.body.facultyNotes) {
      appointment.facultyNotes = req.body.facultyNotes;
    }
    if (req.body.meetingLink) {
      appointment.meetingLink = req.body.meetingLink;
    }

    await appointment.save();
    await appointment.populate('studentId', 'name email');
    await appointment.populate('facultyId', 'name email department designation');

    // Send status email to student (best-effort; do not block response)
    try {
      if (appointment.studentId?.email) {
        await sendAppointmentStatusEmail({
          toEmail: appointment.studentId.email,
          studentName: appointment.studentId.name,
          facultyName: appointment.facultyId?.name,
          status,
          date: appointment.date,
          time: appointment.time,
          duration: appointment.duration,
          reason: appointment.reason,
          meetingLink: appointment.meetingLink,
          facultyNotes: appointment.facultyNotes,
        });
      } else {
        console.warn('Student email missing; skipping student status email');
      }
    } catch (emailErr) {
      console.warn('Failed to send appointment status email to student:', emailErr?.message || emailErr);
    }

    res.status(200).json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message,
    });
  }
};

// Get pending appointments for faculty
export const getPendingAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can view pending appointments',
      });
    }

    const appointments = await Appointment.find({
      facultyId: req.user.id,
      status: 'pending',
    })
      .populate('studentId', 'name email')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending appointments',
      error: error.message,
    });
  }
};

// Get all faculty (for student to select)
export const getFacultyList = async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('name email department designation')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty list',
      error: error.message,
    });
  }
};

