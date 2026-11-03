import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUserCheck,
} from "react-icons/fi";
import api from "../services/api";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/signup", form);

      alert(res.data.message);

      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Signup Failed");
    }
  };

  return (
    <div className="signup-container">

      {/* LEFT PANEL */}

      <div className="signup-left">

        <div className="brand-content">

          <h1>BugBuster</h1>

          <p>
            Join our AI-powered coding platform where students can
            solve programming assignments and faculty can evaluate
            code instantly using Artificial Intelligence.
          </p>

          <div className="feature-box">

            <div className="feature">
              🤖 AI Powered Evaluation
            </div>

            <div className="feature">
              📊 Performance Analytics
            </div>

            <div className="feature">
              ⚡ Instant Feedback
            </div>

            <div className="feature">
              🎓 Faculty Dashboard
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="signup-right">

        <div className="signup-card">

          <h2>Create Account 🚀</h2>

          <p>
            Register to access the AI Code Evaluation Platform
          </p>

          <form onSubmit={handleSubmit}>

            {/* NAME */}

            <div className="input-group">

              <FiUser className="input-icon" />

              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />

            </div>

            {/* EMAIL */}

            <div className="input-group">

              <FiMail className="input-icon" />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />

            </div>

            {/* PASSWORD */}

            <div className="input-group">

              <FiLock className="input-icon" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <span
                className="eye-icon"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </span>

            </div>

            {/* ROLE */}

            <div className="input-group">

              <FiUserCheck className="input-icon" />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="student">
                  Student
                </option>

                <option value="faculty">
                  Faculty
                </option>

              </select>

            </div>

            <button
              type="submit"
              className="signup-btn"
            >
              Create Account
            </button>

          </form>

          <div className="login-link">

            Already have an account?

            <Link to="/login">
              Login
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;