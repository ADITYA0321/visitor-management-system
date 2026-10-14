import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";

function AllVisitors() {
  const navigate = useNavigate();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

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

        // Dynamic reliable timestamp sorting (Newest first)
        const sortedVisitors = response.data.sort(
          (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
        );
        setVisitors(sortedVisitors);
      } catch (err) {
        console.error("Error fetching all visitors:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchVisitors();
    }
  }, [token]);

  // Filter visitors based on search query & status pill
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.host?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.mobile?.includes(searchQuery);

    const matchesStatus =
      selectedStatus === "All" || v.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statusStyles = {
    Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Rejected: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    "Checked In": "bg-sky-500/10 text-sky-400 border-sky-500/30",
    "Checked Out": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  const statusOptions = ["All", "Pending", "Approved", "Checked In", "Checked Out", "Rejected"];

  return (
    // Outer Wrapper with Dark Ambient Background
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans p-6">
      {/* 🌌 Ambient Glowing Purple Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-xs font-medium text-purple-400 hover:text-purple-300 transition"
              >
                ← Dashboard
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">All Visitors</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage and view complete visitor records.
            </p>
          </div>

          <button
            onClick={() => navigate("/add-visitor")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-purple-600/30 border border-purple-500/50 self-start sm:self-auto"
          >
            + Add New Visitor
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#161b22]/90 backdrop-blur-md rounded-xl border border-gray-800/80 p-4 mb-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search by name, host or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selectedStatus === status
                    ? "bg-purple-600/20 border-purple-500 text-purple-300"
                    : "bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Visitors Table Card */}
        <div className="bg-[#161b22]/90 backdrop-blur-md rounded-xl border border-gray-800/80 p-6 shadow-xl">
          {loading ? (
            <div className="p-12 text-gray-400 animate-pulse text-center">
              Loading visitors list...
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No visitors found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Visitor Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Host / Person</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {filteredVisitors.map((v) => (
                    <tr key={v._id} className="hover:bg-gray-800/40 transition">
                      {/* Photo Column */}
                      <td className="py-3.5 px-4">
                        {v.photo ? (
                          <img
                            src={`http://localhost:4000${v.photo}`}
                            alt={v.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                            N/A
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-white">
                        {v.name}
                        {v.company && (
                          <span className="block text-xs text-gray-500">{v.company}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {v.mobile}
                        {v.email && (
                          <span className="block text-xs text-gray-500">{v.email}</span>
                        )}
                      </td>
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
                          Details →
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
    </div>
  );
}

export default AllVisitors;