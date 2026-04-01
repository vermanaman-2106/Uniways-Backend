import Assignment from "../models/Assignment.js";
import Classroom from "../models/Classroom.js";

// Create Assignment
export const createAssignment = async (req, res) => {
  try {
    if (req.user.role !== "faculty") {
      return res.status(403).json({ success: false, message: "Only faculty can create assignments" });
    }

    const { classroomId, title, description, dueDate } = req.body;

    if (!classroomId || !title || String(title).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "classroomId and title are required",
      });
    }

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    if (classroom.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    let due = undefined;
    if (dueDate) {
      const d = new Date(dueDate);
      if (!Number.isNaN(d.getTime())) due = d;
    }

    let attachmentUrl = "";
    if (req.file) {
      attachmentUrl = `/api/uploads/assignments/${req.file.filename}`;
    }

    const assignment = await Assignment.create({
      classroomId,
      title: String(title).trim(),
      description: description != null ? String(description) : "",
      dueDate: due,
      attachmentUrl,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Assignments by Classroom
export const getAssignments = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    const uid = req.user.id.toString();
    if (req.user.role === "faculty") {
      if (classroom.facultyId.toString() !== uid) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    } else if (req.user.role === "student") {
      if (!classroom.students.some((id) => id.toString() === uid)) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    } else {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const assignments = await Assignment.find({
      classroomId: req.params.classroomId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single assignment (faculty of class or enrolled student)
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    const classroom = await Classroom.findById(assignment.classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    const uid = req.user.id.toString();
    if (req.user.role === "faculty") {
      if (classroom.facultyId.toString() !== uid) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    } else if (req.user.role === "student") {
      if (!classroom.students.some((id) => id.toString() === uid)) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    } else {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};