
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (!user || !user.id || !user.role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === "faculty" ? "/faculty" : "/student"}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
