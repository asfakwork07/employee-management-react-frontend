import { Navigate, Route, Routes } from "react-router-dom";
import GlobalLoader from "./components/GlobalLoader";
import Login from "./auth/Login";
import ForgotPassword from "./auth/ForgotPassword";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Salary from "./pages/Salary";
import Holidays from "./pages/Holidays";
import Roles from "./pages/Roles";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
const Protected = ({ roles, children }) => {
  const token = localStorage.getItem("token"),
    role = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role))
    return <Navigate to="/dashboard" replace />;
  return children;
};
const Public = ({ children }) =>
  localStorage.getItem("token") ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
export default function App() {
  return (
    <>
      <GlobalLoader />
      <Routes>
        <Route
          path="/login"
          element={
            <Public>
              <Login />
            </Public>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Public>
              <ForgotPassword />
            </Public>
          }
        />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route
            path="/dashboard"
            element={
              <Protected roles={["ADMIN", "EMPLOYEE"]}>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/employees"
            element={
              <Protected roles={["ADMIN"]}>
                <Employees />
              </Protected>
            }
          />
          <Route
            path="/attendance"
            element={
              <Protected roles={["ADMIN", "EMPLOYEE"]}>
                <Attendance />
              </Protected>
            }
          />
          <Route
            path="/leaves"
            element={
              <Protected roles={["ADMIN", "EMPLOYEE"]}>
                <Leaves />
              </Protected>
            }
          />
          <Route
            path="/salary"
            element={
              <Protected roles={["ADMIN", "EMPLOYEE"]}>
                <Salary />
              </Protected>
            }
          />
          <Route
            path="/holidays"
            element={
              <Protected roles={["ADMIN", "EMPLOYEE"]}>
                <Holidays />
              </Protected>
            }
          />
          <Route
            path="/roles"
            element={
              <Protected roles={["ADMIN"]}>
                <Roles />
              </Protected>
            }
          />
          <Route
            path="/settings"
            element={
              <Protected roles={["ADMIN"]}>
                <Settings />
              </Protected>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected roles={["EMPLOYEE"]}>
                <Profile />
              </Protected>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <Navigate
              to={localStorage.getItem("token") ? "/dashboard" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}
