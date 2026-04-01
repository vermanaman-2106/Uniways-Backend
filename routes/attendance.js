import express from "express";
const router = express.Router();

import {
  markAttendance,
  getClassroomAttendance,
  getStudentAttendance,
  getMyAttendanceSummary,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/auth.js";

router.post("/mark", protect, markAttendance);
router.get("/summary", protect, getMyAttendanceSummary);
router.get("/classroom/:classroomId", protect, getClassroomAttendance);
router.get("/student", protect, getStudentAttendance);

export default router;