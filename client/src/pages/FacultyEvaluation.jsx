import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./FacultyEvaluation.css";

function FacultyEvaluation() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
  const res = await axios.get(
  `http://localhost:5000/submissions/faculty/${user.id}`
);

setSubmissions(res.data.submissions || []);

      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.log(err);
      alert("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

const evaluateSubmission = async (submission) => {
  try {
    const res = await axios.post(
      `http://localhost:5000/submissions/evaluate/${submission._id}`
    );

    alert("AI Evaluation Completed!");

    // Refresh the table
    fetchSubmissions();

  } catch (err) {
    console.error(err);

    alert(
      err.response?.data?.message || "Evaluation failed"
    );
  }
};
  return (
    <div className="evaluation-page">

      {/* Header */}

      <div className="evaluation-header">
        <div>
          <h1>AI Evaluation</h1>
          <p>Welcome, {user?.name}</p>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/faculty")}
        >
          Back to Dashboard
        </button>
      </div>

      {/* Table */}

      <div className="table-container">

        <table className="evaluation-table">

          <thead>

            <tr>
              <th>Student</th>
              <th>Assignment</th>
              <th>Language</th>
              <th>Status</th>
              <th>Marks</th>
              <th>Feedback</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="7">
                  Loading...
                </td>
              </tr>

            ) : submissions.length === 0 ? (

              <tr>
                <td colSpan="7">
                  No submissions found
                </td>
              </tr>

            ) : (

              submissions.map((submission) => (

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

                  <td>{submission.status}</td>

                 <td>
  {submission.aiEvaluation?.score ?? submission.marks ?? "--"}
</td>

                <td>
  {submission.aiEvaluation?.overallFeedback || "--"}
</td>

                  <td>

                    <button
  className="evaluate-btn"
  disabled={submission.status === "Evaluated"}
  onClick={() => evaluateSubmission(submission)}
>
  {submission.status === "Evaluated"
    ? "Evaluated"
    : "Evaluate"}
</button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default FacultyEvaluation;