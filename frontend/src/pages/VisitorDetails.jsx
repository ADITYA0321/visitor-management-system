import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function VisitorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Pending");

  // LocalStorage se Logged-in User & Role retrieve karein
  const userData = JSON.parse(localStorage.getItem("user"));
  const role = userData?.role;

  useEffect(() => {
    const fetchVisitorDetails = async () => {
      try {
        const token = userData?.token;

        const response = await axios.get(`/api/visitor/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setVisitor(response.data);

        // Fetch hotey hi current status state sync karein
        if (response.data && response.data.status) {
          setStatus(response.data.status);
        }
      } catch (err) {
        console.error("Error fetching visitor details:", err);
      }
    };

    if (id) {
      fetchVisitorDetails();
    }
  }, [id]);

  // 🔄 Status Change Handler (UI State Update + PATCH API Call)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const oldStatus = status; // Backup state for error rollback

    // Instant UI update for smooth responsiveness
    setStatus(newStatus);
    setError("");

    try {
      const token = userData?.token;

      // Existing PATCH route to update visitor status
      await axios.patch(
        `/api/visitor/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Error updating status:", err);
      
      // Revert back to original status if API fails
      setStatus(oldStatus);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update status."
      );
    }
  };

  // ✏️ Edit Navigation Handler
  const handleEdit = () => {
    navigate(`/edit-visitor/${id}`);
  };

  // 🔴 Delete Handler Function
  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this visitor? This action cannot be undone."
    );

    if (!isConfirmed) return;

    try {
      const token = userData?.token;

      await axios.delete(`/api/visitor/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/visitors");
    } catch (err) {
      console.error("Error deleting visitor:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to Delete visitor."
      );
    }
  };

  if (!visitor) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-gray-500 animate-pulse">Loading visitor details...</p>
      </div>
    );
  }

  const statusStyles = {
    Approved: "bg-green-100 text-green-800 border-green-200",
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
    "Checked In": "bg-blue-100 text-blue-800 border-blue-200",
    "Checked Out": "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Navigation & Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate("/visitors")}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition flex items-center gap-1"
        >
          ← Back to Visitors
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Action Buttons Container (Admin Only) */}
        <div className="flex items-center gap-3">
          {role === "admin" && (
            <>
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition shadow-sm"
              >
                Edit Visitor
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition shadow-sm"
              >
                Delete Visitor
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Visitor Details</h1>

          {/* Role Based Status Component */}
          {role === "admin" ? (
            /* Admin view: Dropdown bound to handleStatusChange */
            <div className="flex items-center gap-2">
              <label htmlFor="status-select" className="text-xs font-semibold text-gray-500">
                Status:
              </label>
              <select
                id="status-select"
                value={status}
                onChange={handleStatusChange}
                className={`px-3 py-1 rounded-full text-xs font-semibold border focus:outline-none cursor-pointer ${
                  statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
              </select>
            </div>
          ) : (
            /* Non-Admin view: Read-only Badge */
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Full Name
            </span>
            <p className="text-base font-medium text-gray-900 mt-1">{visitor.name}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Mobile Number
            </span>
            <p className="text-base text-gray-700 mt-1">{visitor.mobile}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Email Address
            </span>
            <p className="text-base text-gray-700 mt-1">{visitor.email || "-"}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Company
            </span>
            <p className="text-base text-gray-700 mt-1">{visitor.company || "-"}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Host / Person to Meet
            </span>
            <p className="text-base text-gray-700 mt-1">{visitor.host}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Visit Date
            </span>
            <p className="text-base text-gray-700 mt-1">
              {visitor.visitDate
                ? new Date(visitor.visitDate).toLocaleDateString()
                : "-"}
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Purpose of Visit
            </span>
            <p className="text-base text-gray-700 mt-1">{visitor.purpose}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisitorDetails;