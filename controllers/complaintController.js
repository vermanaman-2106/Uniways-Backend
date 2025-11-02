import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

// Create complaint (Student and Faculty)
export const createComplaint = async (req, res) => {
  try {
    const { type, title, description, location, building, floor, priority } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!type || !title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, title, description, and location',
      });
    }

    // Validate type
    const validTypes = [
      'ac',
      'projector',
      'hdmi_cable',
      'wifi',
      'furniture',
      'cleanliness',
      'power_outlet',
      'whiteboard',
      'sound_system',
      'lights',
      'water_dispenser',
      'other'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint type',
      });
    }

    // Create complaint
    const complaint = await Complaint.create({
      userId,
      type,
      title,
      description,
      location,
      building: building || '',
      floor: floor || '',
      priority: priority || 'medium',
      status: 'pending',
    });

    // Populate user details
    await complaint.populate('userId', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating complaint',
      error: error.message,
    });
  }
};

// Get all complaints for current user
export const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, priority } = req.query;

    let query = { userId };

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (priority) {
      query.priority = priority;
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints',
      error: error.message,
    });
  }
};

// Get all complaints (Admin/Staff only)
export const getAllComplaints = async (req, res) => {
  try {
    // Check if user is admin or maintenance staff (for now, allow all authenticated users)
    // You can add role-based access control later

    const { status, type, priority } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (priority) {
      query.priority = priority;
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ priority: 1, createdAt: -1 }); // Sort by priority first, then date

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints',
      error: error.message,
    });
  }
};

// Get single complaint
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('assignedTo', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Check if user has permission to view this complaint
    const userId = req.user.id;
    if (
      complaint.userId._id.toString() !== userId &&
      req.user.role !== 'admin' // Add admin check later
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint',
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaint',
      error: error.message,
    });
  }
};

// Update complaint status (Admin/Staff only)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, in_progress, resolved, closed)',
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Update complaint
    complaint.status = status;
    if (adminNotes) {
      complaint.adminNotes = adminNotes;
    }
    if (assignedTo) {
      complaint.assignedTo = assignedTo;
    }
    if (status === 'resolved' || status === 'closed') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();
    await complaint.populate('userId', 'name email role');
    await complaint.populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      message: `Complaint ${status} successfully`,
      data: complaint,
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating complaint',
      error: error.message,
    });
  }
};

// Delete complaint (User can delete their own, Admin can delete any)
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Check permissions
    if (
      complaint.userId.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this complaint',
      });
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting complaint',
      error: error.message,
    });
  }
};

