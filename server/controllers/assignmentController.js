const Assignment = require("../models/Assignment");

const createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create(req.body);

    res.status(201).json({
      message: "Assignment created",
      assignment,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find();

    res.json({
      assignments,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
};