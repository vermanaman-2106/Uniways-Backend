import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";
import Classroom from "../models/Classroom.js";

// Submit Assignment (PDF ONLY)
export const submitAssignment = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can submit assignments",
      });
    }

    const { assignmentId } = req.body;
    let fileUrl = req.body.fileUrl;

    if (req.file) {
      fileUrl = `/api/uploads/submissions/${req.file.filename}`;
    }

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "assignmentId is required",
      });
    }

    if (!fileUrl || typeof fileUrl !== "string") {
      return res.status(400).json({
        success: false,
        message: "PDF submission is required",
      });
    }

    if (!fileUrl.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const classroom = await Classroom.findById(assignment.classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    if (!classroom.students.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this classroom",
      });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId: req.user.id,
      fileUrl,
    });

    res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this assignment",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Submissions (Faculty)
export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignmentId: req.params.assignmentId,
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};