import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function VisitorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Pending");

  // Lightbox modal state for photo zoom
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  // 🔄 Status Change Handler
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const oldStatus = status;

    setStatus(newStatus);
    setError("");

    try {
      const token = userData?.token;

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
      setStatus(oldStatus);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update status."
      );
    }
  };

  const handleEdit = () => {
    navigate(`/edit-visitor/${id}`);
  };

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
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <p className="text-purple-400 animate-pulse text-sm font-medium">Loading visitor details...</p>
      </div>
    );
  }

  // Dark theme badge styling
  const statusStyles = {
    Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    "Checked In": "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "Checked Out": "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans p-6">
      {/* 🌌 Ambient Glowing Purple Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Navigation & Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate("/visitors")}
            className="text-sm font-medium text-gray-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            ← Back to Visitors
          </button>

          {/* Action Buttons Container (Admin Only) */}
          <div className="flex items-center gap-3">
            {role === "admin" && (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Edit Visitor
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Delete Visitor
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Main Details Card */}
        <div className="bg-[#161b22]/90 backdrop-blur-md rounded-xl border border-gray-800/80 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800/80">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Visitor Details</h1>
              <p className="text-xs text-gray-400 mt-1">
                Overview of campus visitor registration profile.
              </p>
            </div>

            {/* Role Based Status Component */}
            {role === "admin" ? (
              <div className="flex items-center gap-2">
                <label htmlFor="status-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status:
                </label>
                <select
                  id="status-select"
                  value={status}
                  onChange={handleStatusChange}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none cursor-pointer bg-gray-900 ${
                    statusStyles[status] || "bg-gray-800 text-gray-300 border-gray-700"
                  }`}
                >
                  <option value="Pending" className="bg-gray-900 text-amber-400">Pending</option>
                  <option value="Approved" className="bg-gray-900 text-emerald-400">Approved</option>
                  <option value="Rejected" className="bg-gray-900 text-rose-400">Rejected</option>
                  <option value="Checked In" className="bg-gray-900 text-blue-400">Checked In</option>
                  <option value="Checked Out" className="bg-gray-900 text-gray-400">Checked Out</option>
                </select>
              </div>
            ) : (
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                  statusStyles[status] || "bg-gray-800 text-gray-300 border-gray-700"
                }`}
              >
                {status}
              </span>
            )}
          </div>

          {/* Visitor Photo & Profile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photo Section */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-900/50 border border-gray-800/80 rounded-xl">
              {visitor.photo ? (
                <div 
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-purple-500/40 shadow-lg"
                >
                  <img
                    src={`http://localhost:4000${visitor.photo}`}
                    alt={visitor.name}
                    className="w-32 h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium">
                    Click to View
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-800/80 rounded-xl border border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                  No Photo
                </div>
              )}
              <span className="text-[10px] text-gray-500 mt-2 uppercase font-medium">
                Visitor Photo
              </span>
            </div>

            {/* Info Grid */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Full Name
                </span>
                <p className="text-sm font-medium text-white mt-1">{visitor.name}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Mobile Number
                </span>
                <p className="text-sm text-gray-300 mt-1">{visitor.mobile}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Email Address
                </span>
                <p className="text-sm text-gray-300 mt-1">{visitor.email || "-"}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Company
                </span>
                <p className="text-sm text-gray-300 mt-1">{visitor.company || "-"}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Host / Person to Meet
                </span>
                <p className="text-sm text-gray-300 mt-1">{visitor.host || "-"}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Visit Date
                </span>
                <p className="text-sm text-gray-300 mt-1">
                  {visitor.visitDate
                    ? new Date(visitor.visitDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Purpose of Visit
                </span>
                <p className="text-sm text-gray-300 mt-1 bg-gray-900/60 p-3 rounded-lg border border-gray-800">
                  {visitor.purpose}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Full-Screen Image Lightbox Modal */}
      {isImageModalOpen && visitor.photo && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div 
            className="relative max-w-3xl max-h-[85vh] p-2 bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-3 -right-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition text-sm font-bold cursor-pointer z-10"
            >
              ✕
            </button>

            {/* Full Expanded Image */}
            <img
              src={`http://localhost:4000${visitor.photo}`}
              alt={visitor.name}
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitorDetails;