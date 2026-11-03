const express = require("express");
const router = express.Router();

const {
  submitAssignment,
  getAllSubmissions,
  getStudentSubmissions,
  getFacultySubmissions,
  evaluateSubmission,
} = require("../controllers/submissionController");

const { runCode } = require("../controllers/codeRunnerController");

router.post("/run", runCode);

router.post("/", submitAssignment);

router.get("/", getAllSubmissions);

router.get("/student/:studentId", getStudentSubmissions);

router.get("/faculty/:facultyId", getFacultySubmissions);

router.post("/evaluate/:submissionId", evaluateSubmission);

module.exports = router;