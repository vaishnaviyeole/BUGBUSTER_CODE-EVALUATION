import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";

import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";

import FacultySubmissions from "./pages/FacultySubmissions";
import FacultyEvaluation from "./pages/FacultyEvaluation";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Authentication */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Student Dashboard */}
        <Route
          path="/student"
          element={
         <ProtectedRoute allowedRole="student">
  <StudentDashboard />
</ProtectedRoute>
          }
        />

        {/* Faculty Dashboard */}
        <Route
          path="/faculty"
          element={
           <ProtectedRoute allowedRole="faculty">
  <FacultyDashboard />
</ProtectedRoute>
          }
        />

        {/* Faculty Submissions */}
        <Route
          path="/faculty/submissions"
          element={
            <ProtectedRoute>
              <FacultySubmissions />
            </ProtectedRoute>
          }
        />

        {/* Faculty AI Evaluation */}
        <Route
          path="/faculty/evaluation"
          element={
            <ProtectedRoute>
              <FacultyEvaluation />
            </ProtectedRoute>
          }
        />

        {/* Invalid Route */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;