import Attendance from "../models/Attendance.js";
import Classroom from "../models/Classroom.js";

// Mark Attendance
export const markAttendance = async (req, res) => {
  try {
    const { classroomId, date, attendance } = req.body;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (classroom.facultyId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const records = await Promise.all(
      attendance.map((item) =>
        Attendance.findOneAndUpdate(
          {
            classroomId,
            studentId: item.studentId,
            date,
          },
          {
            status: item.status,
          },
          { upsert: true, new: true }
        )
      )
    );

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Attendance by Classroom
export const getClassroomAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({
      classroomId: req.params.classroomId,
    }).populate("studentId", "name email");

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Student Attendance
export const getStudentAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({
      studentId: req.user.id,
    });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Attendance summary for the logged-in student in a specific classroom.
 * GET ?classroomId=...
 */
export const getMyAttendanceSummary = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can view attendance summary",
      });
    }

    const { classroomId } = req.query;
    if (!classroomId) {
      return res.status(400).json({
        success: false,
        message: "classroomId is required",
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    const isEnrolled = classroom.students.some((id) => id.toString() === req.user.id);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this classroom",
      });
    }

    const records = await Attendance.find({
      classroomId,
      studentId: req.user.id,
    });

    const totalClasses = records.length;
    let present = 0;
    let absent = 0;
    for (const r of records) {
      if (r.status === "Present") present += 1;
      else if (r.status === "Absent") absent += 1;
    }

    const percentage =
      totalClasses === 0 ? 0 : Math.round((present / totalClasses) * 10000) / 100;

    res.json({
      success: true,
      data: {
        totalClasses,
        present,
        absent,
        percentage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};