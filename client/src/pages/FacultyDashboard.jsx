
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Dashboard.css";
import "./FacultySubmissions.css";

import {
  FaHome,
  FaBook,
  FaRobot,
  FaSignOutAlt,
  FaUsers,
  FaClipboardCheck,
  FaCalendarAlt,
  FaChartLine,
  FaPlusCircle,
} from "react-icons/fa";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { MdAssignmentTurnedIn } from "react-icons/md";

function FacultyDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // ===================== STATES =====================

  const [showModal, setShowModal] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    language: "",
    difficulty: "Easy",
    dueDate: "",
  });

  // ===================== FETCH DASHBOARD DATA =====================

  const fetchDashboardData = async () => {
    try {
      const [assignmentRes, submissionRes] = await Promise.all([
        axios.get("http://localhost:5000/assignments"),
        axios.get(
          `http://localhost:5000/submissions/faculty/${user.id}`
        ),
      ]);

      const allAssignments = assignmentRes.data.assignments || [];

      const myAssignments = allAssignments.filter(
        (item) =>
          item.createdBy === user.id ||
          item.createdBy?._id === user.id
      );

      setAssignments(myAssignments);

      const submissions = submissionRes.data.submissions || [];

      setRecentSubmissions(submissions);
    } catch (err) {
      console.log("Dashboard data error:", err);
    }
  };

  // ===================== INITIAL LOAD & AUTO REFRESH =====================

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ===================== LIVE STATISTICS =====================

  const totalAssignments = assignments.length;

  const totalSubmissions = recentSubmissions.length;

  const pendingReviews = recentSubmissions.filter(
    (item) => item.status !== "Evaluated"
  ).length;

  const evaluatedSubmissions = recentSubmissions.filter(
    (item) => item.status === "Evaluated"
  ).length;

  // Unique students who submitted assignments

  const studentsSubmitted = new Set(
    recentSubmissions
      .map((item) =>
        typeof item.studentId === "object"
          ? item.studentId?._id
          : item.studentId
      )
      .filter(Boolean)
      .map(String)
  ).size;

  // Average AI score

  const scores = recentSubmissions
    .filter((item) => item.status === "Evaluated")
    .map((item) =>
      Number(item.aiEvaluation?.score ?? item.marks)
    )
    .filter((score) => Number.isFinite(score));

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((total, score) => total + score, 0) /
            scores.length
        )
      : 0;

  // Evaluation completion rate

  const completionRate =
    totalSubmissions > 0
      ? Math.round(
          (evaluatedSubmissions / totalSubmissions) * 100
        )
      : 0;

  // Assignments due today

  const today = new Date();

  const dueToday = assignments.filter((item) => {
    if (!item.dueDate) return false;

    const dueDate = new Date(item.dueDate);

    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  }).length;

  // ===================== MONTHLY SUBMISSION ANALYTICS =====================

  const submissionData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - 5 + index,
      1
    );

    const count = recentSubmissions.filter((item) => {
      const submittedDate = new Date(
        item.submittedAt || item.createdAt
      );

      return (
        !isNaN(submittedDate.getTime()) &&
        submittedDate.getMonth() === date.getMonth() &&
        submittedDate.getFullYear() === date.getFullYear()
      );
    }).length;

    return {
      month: date.toLocaleString("en-US", { month: "short" }),
      submissions: count,
    };
  });

  // ===================== ASSIGNMENT DIFFICULTY ANALYTICS =====================

  const assignmentData = ["Easy", "Medium", "Hard"].map((level) => ({
    name: level,
    value: assignments.filter(
      (item) =>
        item.difficulty?.toLowerCase() === level.toLowerCase()
    ).length,
  }));

  // ===================== SUBMISSION STATUS ANALYTICS =====================

  const statusData = ["Evaluated", "Pending", "Submitted"].map(
    (status) => ({
      name: status,
      value: recentSubmissions.filter(
        (item) => item.status === status
      ).length,
    })
  );

  // ===================== PROGRAMMING LANGUAGE ANALYTICS =====================

  const languageCounts = {};

  recentSubmissions.forEach((item) => {
    const language = item.assignmentId?.language || "Other";

    languageCounts[language] =
      (languageCounts[language] || 0) + 1;
  });

  const languageData = Object.entries(languageCounts).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];

  // ===================== UPCOMING DEADLINES =====================

  const upcomingDeadlines = assignments
    .filter((item) => item.dueDate && new Date(item.dueDate) >= new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  // ===================== LOGOUT =====================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ===================== HANDLE INPUT =====================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ===================== CREATE ASSIGNMENT =====================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/assignments",
        {
          ...formData,
          createdBy: user.id,
        }
      );

      alert(res.data.message);

      await fetchDashboardData();

      setFormData({
        title: "",
        description: "",
        language: "",
        difficulty: "Easy",
        dueDate: "",
      });

      setShowModal(false);
    } catch (err) {
      alert(
        err.response?.data?.message || "Something went wrong"
      );
    }
  };

  // ===================== UI =====================

  return (
    <div className="dashboard">

      {/* ================= SIDEBAR ================= */}

      <div className="sidebar">

        <div className="logo-section">
          <div className="logo-icon">🎓</div>

          <div>
            <h2 className="logo">AI-Powered</h2>
            <p className="logo-subtitle">
              Programming Assignment Evaluation System
            </p>
          </div>
        </div>

        <div
          className="menu active"
          onClick={() => navigate("/faculty")}
        >
          <span className="menu-icon">
            <FaHome />
          </span>
          Dashboard
        </div>

        <div
          className="menu"
          onClick={() => setShowAssignments(true)}
        >
          <span className="menu-icon">
            <FaBook />
          </span>
          Assignments
        </div>

        <div
          className="menu"
          onClick={() => navigate("/faculty/submissions")}
        >
          <span className="menu-icon">
            <MdAssignmentTurnedIn />
          </span>
          Submissions
        </div>

        <div
          className="menu"
          onClick={() => navigate("/faculty/evaluation")}
        >
          <span className="menu-icon">
            <FaRobot />
          </span>
          AI Evaluation
        </div>

        <div className="menu logout" onClick={logout}>
          <span className="menu-icon">
            <FaSignOutAlt />
          </span>
          Logout
        </div>

      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">

        {/* ================= TOP BAR ================= */}

        <div className="topbar">

          <div className="top-left">
            <h1>Faculty Dashboard</h1>
            <p>Welcome back, {user?.name}</p>
          </div>

          <div className="top-right">

            <div className="search-box">
              <input
                type="text"
                placeholder="Search assignments..."
              />
            </div>

            <div className="notification">
              🔔
            </div>

            <div className="profile-card">

              <div className="profile-avatar">
                <img
                  src={
                    user?.profileImage ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(user?.name || "Faculty")
                  }
                  alt={user?.name || "Faculty"}
                />
              </div>

              <div>
                <h4>{user?.name}</h4>
                <p>Faculty</p>
              </div>

            </div>

          </div>

        </div>

        {/* ================= LIVE STATISTICS ================= */}

        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              <FaBook />
            </div>
            <h3>Total Assignments</h3>
            <h1>{totalAssignments}</h1>
            <p>Assignments Created</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <h3>Students Submitted</h3>
            <h1>{studentsSubmitted}</h1>
            <p>Unique Students</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaClipboardCheck />
            </div>
            <h3>Pending Reviews</h3>
            <h1>{pendingReviews}</h1>
            <p>Waiting for Evaluation</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaRobot />
            </div>
            <h3>Average AI Score</h3>
            <h1>{scores.length > 0 ? `${averageScore}%` : "--"}</h1>
            <p>Evaluated Submissions</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <h3>Evaluation Rate</h3>
            <h1>{completionRate}%</h1>
            <p>Submissions Evaluated</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <h3>Due Today</h3>
            <h1>{dueToday}</h1>
            <p>Assignments Due Today</p>
          </div>

        </div>

        {/* ================= QUICK ACTIONS ================= */}

        <h2 className="section-title">Quick Actions</h2>

        <div className="actions-grid">

          <div
            className="action-card"
            onClick={() => setShowModal(true)}
          >
            <div className="action-icon">
              <FaPlusCircle />
            </div>
            <h3>Create Assignment</h3>
            <p>Create new coding assignment</p>
          </div>

          <div
            className="action-card"
            onClick={() => setShowAssignments(true)}
          >
            <div className="action-icon">
              <FaBook />
            </div>
            <h3>Assignments</h3>
            <p>Manage assignments</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/faculty/submissions")}
          >
            <div className="action-icon">
              <MdAssignmentTurnedIn />
            </div>
            <h3>Submissions</h3>
            <p>View student submissions</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/faculty/evaluation")}
          >
            <div className="action-icon">
              <FaRobot />
            </div>
            <h3>AI Evaluation</h3>
            <p>Review AI scores</p>
          </div>

        </div>

        {/* ================= LIVE ANALYTICS ================= */}

        <h2 className="section-title">Analytics Overview</h2>

        <div className="charts-grid">

          {/* Monthly Submissions */}

          <div className="chart-card">

            <h3>Monthly Submissions</h3>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={submissionData}>

                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Bar
                  dataKey="submissions"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>

          {/* Submission Status */}

          <div className="chart-card">

            <h3>Submission Status</h3>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>

                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

          {/* Assignment Difficulty */}

          <div className="chart-card">

            <h3>Assignment Difficulty</h3>

            <ResponsiveContainer width="100%" height={280}>
              <PieChart>

                <Pie
                  data={assignmentData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {assignmentData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

          {/* Programming Language Distribution */}

          <div className="chart-card">

            <h3>Programming Language Distribution</h3>

            {languageData.length === 0 ? (

              <p className="no-data">
                No language data available yet.
              </p>

            ) : (

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>

                  <Pie
                    data={languageData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {languageData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>

            )}

          </div>

        </div>

        {/* ================= RECENT SUBMISSIONS ================= */}

        <h2 className="section-title">Recent Submissions</h2>

        <div className="submission-table-container">

          <table className="submission-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Language</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>AI Score</th>
              </tr>
            </thead>

            <tbody>

              {recentSubmissions.length === 0 ? (

                <tr>
                  <td colSpan="6" className="no-data">
                    No submissions available.
                  </td>
                </tr>

              ) : (

                recentSubmissions.map((submission) => (

                  <tr key={submission._id}>

                    <td>
                      {submission.studentId?.name || "Unknown"}
                    </td>

                    <td>
                      {submission.assignmentId?.title || "Unknown"}
                    </td>

                    <td>
                      {submission.assignmentId?.language || "-"}
                    </td>

                    <td>
                      {new Date(
                        submission.submittedAt || submission.createdAt
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={`status ${
                          submission.status === "Evaluated"
                            ? "reviewed"
                            : submission.status === "Pending"
                            ? "pending"
                            : "submitted"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`score ${
                          (submission.aiEvaluation?.score || 0) >= 90
                            ? "excellent"
                            : (submission.aiEvaluation?.score || 0) >= 70
                            ? "good"
                            : "pending-score"
                        }`}
                      >
                        {submission.aiEvaluation?.score ?? "--"}
                      </span>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* ================= OVERVIEW ================= */}

        <h2 className="section-title">Overview</h2>

        <div className="overview-grid">

          <div className="overview-card">

            <h3>
              <FaCalendarAlt /> Upcoming Deadlines
            </h3>

            {upcomingDeadlines.length === 0 ? (

              <p>No upcoming deadlines.</p>

            ) : (

              upcomingDeadlines.map((item) => (

                <div
                  key={item._id}
                  className="deadline-item"
                >

                  <strong>{item.title}</strong>

                  <span>
                    {new Date(item.dueDate).toLocaleDateString()}
                  </span>

                </div>

              ))

            )}

          </div>

        </div>

        {/* ================= CREATE ASSIGNMENT MODAL ================= */}

        {showModal && (

          <div className="modal-overlay">

            <div className="create-modal">

              <h2>Create Assignment</h2>

              <form onSubmit={handleSubmit}>

                <input
                  type="text"
                  name="title"
                  placeholder="Assignment Title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="form-input"
                />

                <textarea
                  name="description"
                  placeholder="Assignment Description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="form-input"
                />

                <input
                  type="text"
                  name="language"
                  placeholder="Programming Language"
                  value={formData.language}
                  onChange={handleChange}
                  required
                  className="form-input"
                />

                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>

                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  className="form-input"
                />

                <div className="modal-buttons">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-btn"
                  >
                    Create Assignment
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* ================= VIEW ASSIGNMENTS MODAL ================= */}

        {showAssignments && (

          <div className="modal-overlay">

            <div className="assignment-modal">

              <h2 style={{ marginBottom: "25px" }}>
                Your Assignments
              </h2>

              {assignments.length === 0 ? (

                <h3>No assignments created yet.</h3>

              ) : (

                assignments.map((assignment) => (

                  <div
                    key={assignment._id}
                    className="assignment-item"
                  >

                    <h3>{assignment.title}</h3>

                    <p>{assignment.description}</p>

                    <p>
                      <strong>Language :</strong>{" "}
                      {assignment.language}
                    </p>

                    <p>
                      <strong>Difficulty :</strong>{" "}
                      {assignment.difficulty}
                    </p>

                    <p>
                      <strong>Due Date :</strong>{" "}
                      {new Date(
                        assignment.dueDate
                      ).toLocaleDateString()}
                    </p>

                  </div>

                ))

              )}

              <button
                onClick={() => setShowAssignments(false)}
                className="close-btn"
              >
                Close
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default FacultyDashboard;
