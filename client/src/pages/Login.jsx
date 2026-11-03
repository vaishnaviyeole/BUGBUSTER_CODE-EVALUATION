import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
} from "react-icons/fi";
import api from "../services/api";
import "./Login.css";


import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
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
      const res = await api.post("/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login Successful");

      if (res.data.user.role === "faculty") {
        navigate("/faculty");
      } else {
        navigate("/student");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

return (
  <div className="login-container">

    {/* Left Side */}

    <div className="login-left">

      <div className="brand-content">

        <h1>BugBuster</h1>

        <p>
          Smart coding assignments, AI-powered evaluation,
          instant feedback, and performance analytics for
          students and faculty.
        </p>

      </div>

    </div>

    {/* Right Side */}

    <div className="login-right">

      <div className="login-card">

        <h2>Welcome Back 👋</h2>

        <p>
          Login to continue to your dashboard.
        </p>

        <form onSubmit={handleSubmit}>

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
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>

          </div>

          <button
            type="submit"
            className="login-btn"
          >
            <FiLogIn />
            Login
          </button>

        </form>

        <div className="signup-link">

          Don't have an account?

          <Link to="/signup">
            Create Account
          </Link>

        </div>

      </div>

    </div>

  </div>
);
}

export default Login;