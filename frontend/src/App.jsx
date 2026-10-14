import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Visitors from "./pages/Visitors";
import AddVisitor from "./pages/AddVisitor";
import VisitorDetails from "./pages/VisitorDetails";
import EditVisitor from "./pages/EditVisitor";
import Layout from "./pages/Layout";
import Users from "./pages/Users";
import Appointments from "./pages/Appointments";
import Passes from "./pages/Passes";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";

import "./App.css";

function App() {
  return (
    <Routes>
      {/* 🔓 Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* 🔒 Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Visitors Routes */}
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/add-visitor" element={<AddVisitor />} />
        <Route path="/visitors/:id" element={<VisitorDetails />} />
        <Route path="/edit-visitor/:id" element={<EditVisitor />} />
        <Route path="/visitors/edit/:id" element={<EditVisitor />} />

        {/* System Management Routes */}
        <Route path="/users" element={<Users />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/passes" element={<Passes />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;