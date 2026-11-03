const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  code: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    enum: ["Pending", "Submitted", "Evaluated"],
    default: "Submitted",
  },

  submittedAt: {
    type: Date,
    default: Date.now,
  },

  marks: {
    type: Number,
    default: 0,
  },

  feedback: {
    type: String,
    default: "",
  },

  aiEvaluation: {
    score: {
      type: Number,
      default: 0,
    },
    correctness: {
      type: String,
      default: "",
    },
    timeComplexity: {
      type: String,
      default: "",
    },
    spaceComplexity: {
      type: String,
      default: "",
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    overallFeedback: {
      type: String,
      default: "",
    },
    evaluatedAt: {
      type: Date,
    },
    provider: {
  type: String,
  enum: ["gemini", "groq", "openrouter"],
  default: "gemini"
},
  },
});
module.exports = mongoose.model("Submission", submissionSchema);