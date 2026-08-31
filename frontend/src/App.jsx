import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Visitors from "./pages/Visitors";


import './App.css';
import AddVisitor from "./pages/AddVisitor";
import VisitorDetails from "./pages/VisitorDetails";
import EditVisitor from "./pages/EditVisitor";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors"
        element={
          <ProtectedRoute>
            <Visitors />
          </ProtectedRoute>
        }
      />
      <Route path="/add-visitor" 
      element={
        <ProtectedRoute>
          <AddVisitor />
        </ProtectedRoute>
      }
       />
       <Route
          path="/visitors/:id"
          element={
            <ProtectedRoute>
              <VisitorDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit-visitor/:id"
          element={
            <ProtectedRoute>
              <EditVisitor />
            </ProtectedRoute>
          }
        />
    </Routes>
  );
}

export default App;