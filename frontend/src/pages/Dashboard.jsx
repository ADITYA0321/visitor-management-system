import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const userData = JSON.parse(localStorage.getItem("user"));
  const token = userData?.token;

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await axios.get("/api/visitor", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setVisitors(response.data);
      } catch (err) {
        console.error("Error fetching visitors for dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchVisitors();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  // Status Filter Logic
  const totalVisitors = visitors.length;
  const pendingVisitors = visitors.filter((v) => v.status === "Pending").length;
  const approvedVisitors = visitors.filter((v) => v.status === "Approved").length;
  const checkedInVisitors = visitors.filter((v) => v.status === "Checked In").length;
  const checkedOutVisitors = visitors.filter((v) => v.status === "Checked Out").length;

  const recentVisitors = [...visitors]
    .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
    .slice(0, 5);

  const statusStyles = {
    Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    "Checked In": "bg-sky-500/10 text-sky-400 border-sky-500/30",
    "Checked Out": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  return (
    // Outer Wrapper with Dark Gradient & Purple Radial Glow Background
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans">
      {/* 🌌 Ambient Glowing Purple Gradient Effect (GitHub Style) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-center pb-4 border-b border-gray-800/80">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Welcome back, <span className="font-semibold text-purple-400">{user?.name || "User"}</span> ({user?.email || "N/A"})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/add-visitor")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-purple-600/30 border border-purple-500/50"
            >
              + Add New Visitor
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-900 hover:bg-rose-950/40 text-rose-400 border border-gray-800 hover:border-rose-800/50 font-medium text-sm rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {loading ? (
          <div className="p-12 text-gray-400 animate-pulse text-center">
            Loading dashboard metrics...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Visitors */}
              <div className="bg-[#161b22]/90 backdrop-blur-md p-5 rounded-xl border border-gray-800/80 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Total Visitors
                  </span>
                  <p className="text-3xl font-bold text-white mt-1">{totalVisitors}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center text-xl">
                  👥
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-[#161b22]/90 backdrop-blur-md p-5 rounded-xl border border-amber-500/30 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                    Pending Approvals
                  </span>
                  <p className="text-3xl font-bold text-amber-300 mt-1">{pendingVisitors}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center text-xl">
                  ⏳
                </div>
              </div>

              {/* Checked In */}
              <div className="bg-[#161b22]/90 backdrop-blur-md p-5 rounded-xl border border-sky-500/30 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                    Checked In (Inside)
                  </span>
                  <p className="text-3xl font-bold text-sky-300 mt-1">{checkedInVisitors}</p>
                </div>
                <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center text-xl">
                  🏢
                </div>
              </div>

              {/* Approved */}
              <div className="bg-[#161b22]/90 backdrop-blur-md p-5 rounded-xl border border-emerald-500/30 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Approved
                  </span>
                  <p className="text-3xl font-bold text-emerald-300 mt-1">{approvedVisitors}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center text-xl">
                  ✅
                </div>
              </div>
            </div>

            {/* Checked Out Count Bar */}
            <div className="bg-[#161b22]/90 backdrop-blur-md p-4 rounded-xl border border-gray-800/80 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-gray-800/80 rounded-full text-lg">🚪</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">Checked Out Visitors</h3>
                  <p className="text-xs text-gray-400">Visitors who have exited the premises</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-200">{checkedOutVisitors}</span>
            </div>

            {/* 📋 Recent Visitors Table Section */}
            <div className="bg-[#161b22]/90 backdrop-blur-md rounded-xl border border-gray-800/80 p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Recent Visitors (Latest 5)</h2>
                <button
                  onClick={() => navigate("/visitors")}
                  className="text-sm font-medium text-purple-400 hover:text-purple-300 transition"
                >
                  View All Visitors →
                </button>
              </div>

              {recentVisitors.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No visitors found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Visitor Name</th>
                        <th className="py-3 px-4">Host / Meeting With</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 text-sm">
                      {recentVisitors.map((v) => (
                        <tr key={v._id} className="hover:bg-gray-800/40 transition">
                          <td className="py-3.5 px-4 font-medium text-white">{v.name}</td>
                          <td className="py-3.5 px-4 text-gray-300">{v.host}</td>
                          <td className="py-3.5 px-4 text-gray-400">{v.purpose}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                statusStyles[v.status] || "bg-gray-800 text-gray-300 border-gray-700"
                              }`}
                            >
                              {v.status || "Pending"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => navigate(`/visitors/${v._id}`)}
                              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;