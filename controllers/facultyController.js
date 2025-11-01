import Faculty from '../models/Faculty.js';

// Get all faculty members
export const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: faculty.length,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty data',
      error: error.message,
    });
  }
};

// Get single faculty member by ID
export const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found',
      });
    }
    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty data',
      error: error.message,
    });
  }
};

// Create faculty member
export const createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating faculty member',
      error: error.message,
    });
  }
};

