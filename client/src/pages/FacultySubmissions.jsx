import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FacultySubmissions.css";

function FacultySubmissions() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [aiProvider, setAiProvider] = useState("gemini");
const [evaluating, setEvaluating] = useState(false);
// 1. Replace loadSubmissions()

const loadSubmissions = async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/submissions/faculty/${user.id}`
    );

    setSubmissions(res.data.submissions);
  } catch (err) {
    console.error(err);
    alert("Unable to load submissions");
  }
};

  useEffect(() => {
    loadSubmissions();
  }, []);
// 2. Replace evaluateSubmission()

const evaluateSubmission = async (submissionId) => {
  try {
    setEvaluating(true);

    const res = await axios.post(
      `http://localhost:5000/submissions/evaluate/${submissionId}`,
      { provider: aiProvider }
    );

    setSelectedSubmission(res.data.submission);

    setSubmissions((prev) =>
      prev.map((item) =>
        item._id === submissionId ? res.data.submission : item
      )
    );

    alert(`Evaluation completed using ${res.data.provider}!`);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Evaluation Failed");
  } finally {
    setEvaluating(false);
  }
};
// 3. Replace filteredSubmissions

const filteredSubmissions = submissions.filter((submission) => {
  const matchesSearch =
    submission.studentId?.name
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
    submission.assignmentId?.title
      ?.toLowerCase()
      .includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    submission.status === statusFilter;

  const matchesLanguage =
    languageFilter === "All" ||
    submission.assignmentId?.language === languageFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesLanguage
  );
});

  return (
    <div className="submissions-page">

      {/* Header */}

      <div className="submissions-header">

        <div>
          <h1>Student Submissions</h1>
          <p>
            Review and evaluate student coding submissions
          </p>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/faculty")}
        >
          ← Back to Dashboard
        </button>

      </div>

      {/* Search & Filters */}

      <div className="toolbar">

        <input
          type="text"
          placeholder="Search student or assignment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-box"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-box"
        >
          <option>All</option>
          <option>Submitted</option>
          <option>Evaluated</option>
          <option>Pending</option>
        </select>

        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="filter-box"
        >
          <option>All</option>
          <option>C</option>
          <option>C++</option>
          <option>Java</option>
          <option>Python</option>
        </select>

      </div>

      {/* Submission List */}

      <div className="submission-list">

        {filteredSubmissions.length === 0 ? (

          <div className="empty-state">
            <h2>No Submissions Found</h2>
          </div>

        ) : (

          filteredSubmissions.map((submission) => (

            <div
              key={submission._id}
              className="submission-card"
            >

              <div className="submission-info">

                <h3>
                  {submission.assignmentId?.title}
                </h3>

                <p>
                  <strong>Student:</strong>{" "}
                  {submission.studentId?.name}
                </p>

               <p>
  <strong>Language:</strong>{" "}
  {submission.assignmentId?.language}
</p>

<p>
  <strong>Submitted:</strong>{" "}
  {new Date(submission.submittedAt).toLocaleString()}
</p>

              </div>

              <div className="submission-actions">

                <span
                  className={`status ${submission.status.toLowerCase()}`}
                >
                  {submission.status}
                </span>

                <button
                  className="view-btn"
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setShowModal(true);
                  }}
                >
                  View Details
                </button>

              </div>

            </div>

          ))

        )}

      </div>

      {/* ================= VIEW SUBMISSION MODAL ================= */}

{showModal && selectedSubmission && (
  <div className="modal-overlay">

    <div className="submission-modal">

      {/* Header */}

      <div className="modal-header">

        <div>

          <h2>{selectedSubmission.assignmentId?.title}</h2>

          <p>
            Submitted by <strong>{selectedSubmission.studentId?.name}</strong>
          </p>

        </div>

        <button
          className="close-btn"
          onClick={() => setShowModal(false)}
        >
          ✕
        </button>

      </div>

      {/* Student Details */}

      <div className="details-grid">

        <div className="detail-card">
          <span>Student</span>
          <h4>{selectedSubmission.studentId?.name}</h4>
        </div>

        <div className="detail-card">
          <span>Email</span>
          <h4>{selectedSubmission.studentId?.email}</h4>
        </div>

        <div className="detail-card">
          <span>Language</span>
          <h4>{selectedSubmission.assignmentId?.language}</h4>
        </div>

        <div className="detail-card">
          <span>Status</span>

          <span
            className={`status ${selectedSubmission.status.toLowerCase()}`}
          >
            {selectedSubmission.status}
          </span>

        </div>

      </div>

      {/* Submitted Code */}

      <div className="code-section">

        <h3>Submitted Code</h3>

        <div className="code-container">

<pre>
<code>
{selectedSubmission.code}
</code>
</pre>

        </div>

      </div>

      {/* Action Buttons */}

      <div className="modal-actions">
<label htmlFor="ai-provider">AI Provider:</label>

<select
  id="ai-provider"
  value={aiProvider}
  onChange={(e) => setAiProvider(e.target.value)}
  disabled={evaluating}
>
  <option value="gemini">Google Gemini</option>
  <option value="groq">Groq</option>
  <option value="openrouter">OpenRouter</option>
</select>

<button
  className="evaluate-btn"
  disabled={evaluating}
  onClick={() => evaluateSubmission(selectedSubmission._id)}
>
  {evaluating ? "Evaluating..." : "🤖 Evaluate with AI"}
</button>
       
        <button
          className="close-modal-btn"
          onClick={() => setShowModal(false)}
        >
          Close
        </button>

      </div>

      {/* ================= AI RESULT ================= */}

      {selectedSubmission.aiEvaluation && (

        <div className="ai-section">

          <h2>AI Evaluation Report</h2>

          <div className="score-grid">

            <div className="score-card">
              <span>Score</span>
              <h3>{selectedSubmission.aiEvaluation.score}/100</h3>
            </div>

            <div className="score-card">
              <span>Correctness</span>
              <h3>
                {selectedSubmission.aiEvaluation.correctness}
              </h3>
            </div>

            <div className="score-card">
              <span>Time Complexity</span>
              <h3>
                {selectedSubmission.aiEvaluation.timeComplexity}
              </h3>
            </div>

            <div className="score-card">
              <span>Space Complexity</span>
              <h3>
                {selectedSubmission.aiEvaluation.spaceComplexity}
              </h3>
            </div>

          </div>

          <div className="feedback-grid">

            <div className="feedback-card">

              <h3>✅ Strengths</h3>

              <ul>
                {selectedSubmission.aiEvaluation.strengths?.map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ul>

            </div>

            <div className="feedback-card">

              <h3>⚠ Weaknesses</h3>

              <ul>
                {selectedSubmission.aiEvaluation.weaknesses?.map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ul>

            </div>

          </div>

          <div className="feedback-card">

            <h3>💡 Suggestions</h3>

            <ul>
              {selectedSubmission.aiEvaluation.suggestions?.map(
                (item, index) => (
                  <li key={index}>{item}</li>
                )
              )}
            </ul>

          </div>

          <div className="overall-feedback">

            <h3>Overall Feedback</h3>

            <p>
              {selectedSubmission.aiEvaluation.overallFeedback}
            </p>

          </div>

        </div>

      )}

    </div>

  </div>
)}

    </div>
  );
}

export default FacultySubmissions;