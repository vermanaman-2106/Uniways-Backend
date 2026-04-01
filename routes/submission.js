import express from "express";
const router = express.Router();

import {
  submitAssignment,
  getSubmissions,
} from "../controllers/submissionController.js";

import { protect } from "../middleware/auth.js";
import { optionalSubmissionPdf } from "../middleware/submissionUpload.js";

router.post("/upload", protect, optionalSubmissionPdf, submitAssignment);
router.get("/:assignmentId", protect, getSubmissions);

export default router;