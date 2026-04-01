import Classroom from "../models/Classroom.js";
import User from "../models/User.js";

// Create Classroom
export const createClassroom = async (req, res) => {
  try {
    const { subjectName } = req.body;

    const classroom = await Classroom.create({
      subjectName,
      facultyId: req.user.id,
    });

    res.status(201).json({ success: true, data: classroom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Students
export const addStudents = async (req, res) => {
  try {
    const { classroomId, emails } = req.body;

    // This feature allows faculty to dynamically add students to classrooms,
    // linking users via email and enabling access to assignments and attendance.

    if (req.user.role !== "faculty") {
      return res.status(403).json({ success: false, message: "Only faculty can add students" });
    }

    if (!classroomId || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide classroomId and at least one email",
      });
    }

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    if (classroom.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const normalizedEmails = [...new Set(
      emails
        .filter((email) => typeof email === "string")
        .map((email) => email.toLowerCase().trim())
        .filter(Boolean)
    )];

    if (!normalizedEmails.length) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses provided",
      });
    }

    const students = await User.find({
      email: { $in: normalizedEmails },
      role: "student",
    }).select("_id email");

    const foundEmailSet = new Set(students.map((student) => student.email?.toLowerCase().trim()));
    const notFoundEmails = normalizedEmails.filter((email) => !foundEmailSet.has(email));

    const existingIds = classroom.students.map((id) => id.toString());
    const mergedIds = [...new Set([...existingIds, ...students.map((student) => student._id.toString())])];

    classroom.students = mergedIds;

    await classroom.save();

    const updatedClassroom = await Classroom.findById(classroomId)
      .populate("students", "name email")
      .populate("facultyId", "name email");

    res.json({
      success: true,
      data: updatedClassroom,
      meta: {
        addedCount: students.length,
        notFoundEmails,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Classrooms
export const getMyClassrooms = async (req, res) => {
  try {
    let classrooms;

    if (req.user.role === "faculty") {
      classrooms = await Classroom.find({ facultyId: req.user.id });
    } else {
      classrooms = await Classroom.find({
        students: req.user.id,
      });
    }

    res.json({ success: true, data: classrooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Classroom
export const getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate("students", "name email")
      .populate("facultyId", "name email");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({ success: true, data: classroom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};