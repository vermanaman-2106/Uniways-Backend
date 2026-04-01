import express from "express";
const router = express.Router();

import {
  createAssignment,
  getAssignments,
  getAssignmentById,
} from "../controllers/assignmentController.js";

import { protect } from "../middleware/auth.js";
import { optionalPdfUpload } from "../middleware/assignmentUpload.js";

router.post("/create", protect, optionalPdfUpload, createAssignment);
router.get("/classroom/:classroomId", protect, getAssignments);
router.get("/:id", protect, getAssignmentById);

export default router;