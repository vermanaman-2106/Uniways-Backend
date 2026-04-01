import express from "express";
const router = express.Router();

import {
  createClassroom,
  addStudents,
  getMyClassrooms,
  getClassroomById,
} from "../controllers/classroomController.js";

import { protect } from "../middleware/auth.js";

router.post("/create", protect, createClassroom);
router.post("/add-students", protect, addStudents);
router.get("/my", protect, getMyClassrooms);
router.get("/:id", protect, getClassroomById);

export default router;