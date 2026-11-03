import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentDashboard.css";
import Editor from "@monaco-editor/react";
import {
  FiHome,
  FiBookOpen,
  FiUpload,
  FiBarChart2,
  FiUser,
  FiLogOut,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiActivity
} from "react-icons/fi";

function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [assignments, setAssignments] = useState([]);
  const [showAssignments, setShowAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [code, setCode] = useState("");
  // ================= CODE RUNNER STATE =================

const [runLanguage, setRunLanguage] = useState("python");
const [customInput, setCustomInput] = useState("");
const [runResult, setRunResult] = useState(null);
const [isRunning, setIsRunning] = useState(false);
  const [submissions, setSubmissions] = useState([]);
const [showSubmissions, setShowSubmissions] = useState(false);
const [showReports, setShowReports] = useState(false);
const [showProfile, setShowProfile] = useState(false);

const [report, setReport] = useState({
  total: 0,
  evaluated: 0,
  pending: 0,
  average: 0,
  highest: 0,
  lowest: 0,
});

  // ================= LOAD ASSIGNMENTS =================

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/assignments"
        );

        setAssignments(res.data.assignments);
      } catch (err) {
        console.error(err);
      }
    };

    loadAssignments();
  }, []);
useEffect(() => {
  if (!user?.id) return;

  const loadSubmissions = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/submissions/student/${user.id}`
      );

      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  loadSubmissions();
}, [user?.id]);

  // ================= LOGOUT =================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ================= SUBMIT ASSIGNMENT =================

  const submitAssignment = async () => {
    try {
      await axios.post("http://localhost:5000/submissions", {
        assignmentId: selectedAssignment._id,
        studentId: user.id,
        code,
      });

      alert("Assignment submitted successfully!");

      setCode("");
      setShowSubmitModal(false);
      setShowModal(false);
      setShowAssignments(false);
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  };

  const generateReport = () => {

  const total = submissions.length;

  const evaluated = submissions.filter(
    (s) => s.status === "Evaluated"
  );

  const pending = submissions.filter(
    (s) => s.status !== "Evaluated"
  );

  const marks = evaluated.map((s) => s.marks || 0);

  const average =
    marks.length > 0
      ? (
          marks.reduce((a, b) => a + b, 0) /
          marks.length
        ).toFixed(2)
      : 0;

  const highest =
    marks.length > 0 ? Math.max(...marks) : 0;

  const lowest =
    marks.length > 0 ? Math.min(...marks) : 0;

  setReport({
    total,
    evaluated: evaluated.length,
    pending: pending.length,
    average,
    highest,
    lowest,
  });

  setShowReports(true);
};
// Calculate dashboard statistics
const submittedAssignmentIds = new Set(
  submissions
    .filter((submission) => submission.assignmentId)
    .map((submission) => {
      const id = submission.assignmentId;

      return typeof id === "object" ? id._id : id;
    })
);

const submittedCount = assignments.filter((assignment) =>
  submittedAssignmentIds.has(assignment._id || assignment.id)
).length;

const pendingCount = Math.max(0, assignments.length - submittedCount);

const evaluatedSubmissions = submissions.filter(
  (submission) =>
    submission.status === "Evaluated" &&
    submission.marks !== null &&
    submission.marks !== undefined &&
    submission.marks !== "" &&
    Number.isFinite(Number(submission.marks))
);

const averageScore =
  evaluatedSubmissions.length > 0
    ? (
        evaluatedSubmissions.reduce(
          (total, submission) => total + Number(submission.marks),
          0
        ) / evaluatedSubmissions.length
      ).toFixed(1)
    : "--";


  // ================= RUN CODE IN DOCKER =================

  const runCode = async () => {
    if (!code.trim()) {
      alert("Please write some code before running.");
      return;
    }

    try {
      setIsRunning(true);
      setRunResult(null);

      const res = await axios.post(
        "http://localhost:5000/submissions/run",
        {
          language: runLanguage,
          code,
          input: customInput,
        },
        {
          timeout: 25000,
        }
      );

      setRunResult(res.data);
    } catch (err) {
      console.error("Code execution failed:", err);

      setRunResult(
        err.response?.data || {
          status: "error",
          output: "",
          error:
            err.code === "ECONNABORTED"
              ? "The request timed out. Please try again."
              : "Unable to connect to the code runner. Check your backend.",
        }
      );
    } finally {
      setIsRunning(false);
    }
  };


return (
  <div className="student-dashboard">

    
    {/* ================= SIDEBAR ================= */}

    <aside className="sidebar">

      <div className="logo-section">
        <h2>AI Code</h2>
        <p>Evaluation System</p>
      </div>

      <nav className="sidebar-menu">
<div
    className="menu-item"
    onClick={() => setShowProfile(true)}
>
    <FiUser />
    <span>Profile</span>
</div>
        <div className="menu-item active">
          <FiHome />
          <span>Dashboard</span>
        </div>

        <div
          className="menu-item"
          onClick={() => setShowAssignments(true)}
        >
          <FiBookOpen />
          <span>Assignments</span>
        </div>



      </nav>

      <button
        className="logout-btn"
        onClick={logout}
      >
        <FiLogOut />
        Logout
      </button>

    </aside>

    {/* ================= MAIN CONTENT ================= */}

    <main className="main-content">

      {/* Header */}

      <div className="dashboard-header">
        <div>
          <h1>Student Dashboard</h1>
          <p>Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}

     <div className="stats-grid">

  <div className="stat-card">
    <FiClipboard className="stat-icon blue" />
    <div>
      <h3>{assignments.length}</h3>
      <p>Total Assignments</p>
    </div>
  </div>

  <div className="stat-card">
    <FiCheckCircle className="stat-icon green" />
    <div>
      <h3>{submittedCount}</h3>
      <p>Submitted</p>
    </div>
  </div>

  <div className="stat-card">
    <FiClock className="stat-icon orange" />
    <div>
      <h3>{pendingCount}</h3>
      <p>Pending</p>
    </div>
  </div>

  <div className="stat-card">
    <FiAward className="stat-icon purple" />
    <div>
      <h3>{averageScore}</h3>
      <p>Average Score</p>
    </div>
  </div>

</div>
{/* ================= QUICK ACTIONS ================= */}

<div className="quick-actions">

  <div
    className="action-card"
    onClick={() => setShowAssignments(true)}
  >
    <FiBookOpen className="action-icon" />
    <h3>Assignments</h3>
    <p>View all available assignments</p>
  </div>

 <div
  className="action-card"
  onClick={() => setShowSubmissions(true)}
>

  <FiUpload className="action-icon" />

  <h3>My Submissions</h3>

  <p>View submitted assignments</p>

</div>

<div
  className="action-card"
  onClick={generateReport}
>

  <FiTrendingUp className="action-icon" />

  <h3>Reports</h3>

  <p>View AI Performance Report</p>

</div>

  

</div>

{/* ================= ASSIGNMENTS TABLE ================= */}

<div className="dashboard-card">

  <div className="card-header">
    <h2>Available Assignments</h2>

    <button
      className="primary-btn"
      onClick={() => setShowAssignments(true)}
    >
      View All
    </button>
  </div>

  <table className="dashboard-table">

    <thead>
      <tr>
        <th>Title</th>
        <th>Language</th>
        <th>Difficulty</th>
        <th>Due Date</th>
      </tr>
    </thead>

    <tbody>

      {assignments.length > 0 ? (

        assignments.slice(0,5).map((assignment) => (

          <tr key={assignment._id}>
            <td>{assignment.title}</td>
            <td>{assignment.language}</td>
            <td>{assignment.difficulty}</td>
            <td>
              {new Date(
                assignment.dueDate
              ).toLocaleDateString()}
            </td>
          </tr>

        ))

      ) : (

        <tr>
          <td colSpan="4" style={{textAlign:"center"}}>
            No assignments available
          </td>
        </tr>

      )}

    </tbody>

  </table>

</div>
    
{/* ================= ASSIGNMENTS MODAL ================= */}

{showAssignments && (

  <div className="modal-overlay">

    <div className="assignment-popup">

      <div className="card-header">
        <h2>Available Assignments</h2>

        <button
          className="danger-btn"
          onClick={() => setShowAssignments(false)}
        >
          Close
        </button>
      </div>

      {assignments.map((assignment) => (

        <div
          key={assignment._id}
          className="assignment-item"
        >

          <div>

            <h3>{assignment.title}</h3>

            <p>{assignment.description}</p>

            <p>
              <strong>Language:</strong> {assignment.language}
            </p>

            <p>
              <strong>Difficulty:</strong> {assignment.difficulty}
            </p>

          </div>

          <button
            className="primary-btn"
            onClick={() => {
              setSelectedAssignment(assignment);
              setShowModal(true);
            }}
          >
            View Details
          </button>

        </div>

      ))}

    </div>

  </div>

)}

{/* ================= ASSIGNMENT DETAILS MODAL ================= */}

{showModal && selectedAssignment && (

  <div className="modal-overlay">

    <div className="details-modal">

      <div className="card-header">

        <h2>{selectedAssignment.title}</h2>

        <button
          className="danger-btn"
          onClick={() => setShowModal(false)}
        >
          ✕
        </button>

      </div>

      <div className="details-content">

        <p>
          <strong>Description:</strong>
        </p>

        <p>{selectedAssignment.description}</p>

        <br />

        <p>
          <strong>Language:</strong>{" "}
          {selectedAssignment.language}
        </p>

        <p>
          <strong>Difficulty:</strong>{" "}
          {selectedAssignment.difficulty}
        </p>

        <p>
          <strong>Due Date:</strong>{" "}
          {new Date(
            selectedAssignment.dueDate
          ).toLocaleDateString()}
        </p>

      </div>

      <div className="button-group">

        <button
          className="success-btn"
          onClick={() => {
            setShowModal(false);
            setShowSubmitModal(true);
          }}
        >
          Submit Assignment
        </button>

        <button
          className="secondary-btn"
          onClick={() => setShowModal(false)}
        >
          Cancel
        </button>

      </div>

    </div>

  </div>

)}

{/* ================= SUBMIT ASSIGNMENT MODAL ================= */}

{showSubmitModal && selectedAssignment && (

  <div className="modal-overlay">

    <div className="submit-modal">

      <div className="card-header">
        <h2>Submit Assignment</h2>

        <button
          className="danger-btn"
          onClick={() => setShowSubmitModal(false)}
        >
          ✕
        </button>
      </div>

      <div className="assignment-info">

        <h3>{selectedAssignment.title}</h3>

        <p>
          <strong>Language:</strong>{" "}
          {selectedAssignment.language}
        </p>

        <p>
          <strong>Difficulty:</strong>{" "}
          {selectedAssignment.difficulty}
        </p>

      </div>

   
  <div className="code-runner">

    <div className="runner-toolbar">
      <label htmlFor="runner-language">
        Programming Language
      </label>

      <select
        id="runner-language"
        value={runLanguage}
        onChange={(e) => {
          setRunLanguage(e.target.value);
          setRunResult(null);
        }}
        className="runner-language-select"
      >
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="python">Python</option>
      </select>
    </div>

    <label className="runner-label">
      Write Your Code
    </label>

  
<div className="monaco-editor-container">
  <Editor
    height="420px"
    language={runLanguage}
    theme="vs-dark"
    value={code}
    onChange={(value) => {
      setCode(value ?? "");
      setRunResult(null);
    }}
    options={{
      minimap: { enabled: false },
      lineNumbers: "on",
      fontSize: 14,
      tabSize: 4,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      padding: { top: 12 },
      suggestOnTriggerCharacters: true,
      quickSuggestions: true
    }}
  />
</div>


    <label className="runner-label">
      Custom Input (stdin)
    </label>

    <textarea
      className="runner-input"
      rows="3"
      placeholder="Enter input for your program, if required..."
      value={customInput}
      onChange={(e) => setCustomInput(e.target.value)}
    />

    <div className="runner-actions">
      <button
        type="button"
        className="run-code-btn"
        onClick={runCode}
        disabled={isRunning}
      >
        {isRunning ? "Running..." : "▶ Run Code"}
      </button>

      <button
        type="button"
        className="secondary-btn"
        onClick={() => {
          setCode("");
          setCustomInput("");
          setRunResult(null);
        }}
        disabled={isRunning}
      >
        Clear
      </button>
    </div>

    {runResult && (
      <div className="runner-output">
        <h3>Execution Result</h3>

        <p className={`runner-status ${runResult.status}`}>
          Status: {runResult.status}
        </p>

        {runResult.output && (
          <>
            <h4>Output</h4>
            <pre>{runResult.output}</pre>
          </>
        )}

        {runResult.error && (
          <>
            <h4>
              {runResult.status === "compile_error"
                ? "Compilation Error"
                : "Error Details"}
            </h4>
            <pre className="runner-error">
              {runResult.error}
            </pre>
          </>
        )}
      </div>
    )}

  </div>


      <div className="button-group">

        <button
          className="secondary-btn"
          onClick={() => setShowSubmitModal(false)}
        >
          Cancel
        </button>

        <button
          className="success-btn"
          onClick={submitAssignment}
        >
          Submit Assignment
        </button>

      </div>

    </div>

  </div>

)}
{/* ================= MY SUBMISSIONS MODAL ================= */}

{showSubmissions && (

  <div className="modal-overlay">

    <div className="submissions-modal">

      <div className="modal-header">

        <h2>📄 My Submissions</h2>

        <button
          className="close-icon"
          onClick={() => setShowSubmissions(false)}
        >
          ✕
        </button>

      </div>

      {submissions.length === 0 ? (

        <div className="empty-state">
          <FiUpload size={45} />
          <h3>No Submissions Yet</h3>
          <p>You haven't submitted any assignments.</p>
        </div>

      ) : (

        <table className="dashboard-table">

          <thead>
            <tr>
              <th>Assignment</th>
              <th>Submitted On</th>
              <th>Status</th>
              <th>Marks</th>
            </tr>
          </thead>

          <tbody>

            {submissions.map((submission) => (

              <tr key={submission._id}>

                <td>
                  <strong>
                    {submission.assignmentId?.title || "Assignment"}
                  </strong>
                </td>

                <td>
                  {new Date(
                    submission.submittedAt || submission.createdAt
                  ).toLocaleDateString()}
                </td>

                <td>

                  <span
                    className={
                      submission.status === "Evaluated"
                        ? "status completed"
                        : "status pending"
                    }
                  >
                    {submission.status}
                  </span>

                </td>

                <td>

                  {submission.marks > 0
                    ? `${submission.marks}%`
                    : "--"}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  </div>

)}

{/* ================= REPORTS MODAL ================= */}

{showReports && (
  <div className="modal-overlay">

    <div className="reports-modal">

      <div className="modal-header">
        <h2>📊 Performance Report</h2>

        <button
          className="close-icon"
          onClick={() => setShowReports(false)}
        >
          ✕
        </button>
      </div>

      <div className="reports-grid">

        <div className="report-card">
          <h3>{report.total}</h3>
          <p>Total Submissions</p>
        </div>

        <div className="report-card">
          <h3>{report.evaluated}</h3>
          <p>Evaluated</p>
        </div>

        <div className="report-card">
          <h3>{report.pending}</h3>
          <p>Pending</p>
        </div>

        <div className="report-card">
          <h3>{report.average}%</h3>
          <p>Average Score</p>
        </div>

        <div className="report-card">
          <h3>{report.highest}%</h3>
          <p>Highest Score</p>
        </div>

        <div className="report-card">
          <h3>{report.lowest}%</h3>
          <p>Lowest Score</p>
        </div>

      </div>

      <div className="report-summary">

        <h3>AI Performance Summary</h3>

        <p>
          You have submitted <strong>{report.total}</strong> assignments.
        </p>

        <p>
          <strong>{report.evaluated}</strong> assignments have been evaluated.
        </p>

        <p>
          Current average score:
          <strong> {report.average}%</strong>
        </p>

      </div>

    </div>

  </div>
)}
{/* ================= PROFILE MODAL ================= */}

{showProfile && (
  <div className="modal-overlay">
    <div className="profile-modal">

      <button
        className="close-icon"
        onClick={() => setShowProfile(false)}
      >
        ✕
      </button>

      <div className="profile-top">

        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        <h2>{user?.name}</h2>

        <p>{user?.email}</p>

        <span className="role-badge">
          {user?.role}
        </span>

      </div>

      <div className="profile-info-grid">

        <div className="info-card">
          <h4>Total Assignments</h4>
          <h2>{assignments.length}</h2>
        </div>

        <div className="info-card">
          <h4>Submissions</h4>
          <h2>{submissions.length}</h2>
        </div>

        <div className="info-card">
          <h4>Average Score</h4>
          <h2>{report.average}%</h2>
        </div>

        <div className="info-card">
          <h4>Status</h4>
          <h2>Active</h2>
        </div>

      </div>

     

      <div className="button-group">

        <button className="primary-btn">
          Edit Profile
        </button>

        <button className="secondary-btn">
          Change Password
        </button>

      </div>

    </div>
  </div>
)}

    </main>

  </div>
);

}

export default StudentDashboard;