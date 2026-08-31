import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AddVisitor() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    company: "",
    host: "",
    visitDate: "",
    purpose: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userData = JSON.parse(localStorage.getItem("user"));
  const token = userData?.token;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/visitor", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Form submit hone ke baad visitors page ya dashboard par redirect
      navigate("/visitors");
    } catch (err) {
      console.error("Error adding visitor:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to add visitor. Please check inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Outer Wrapper with Dark Ambient Background
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans p-6">
      {/* 🌌 Ambient Glowing Purple Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Navigation Bar */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-400 hover:text-white transition flex items-center gap-1"
          >
            ← Back
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-[#161b22]/90 backdrop-blur-md rounded-xl border border-gray-800/80 p-8 shadow-2xl">
          <div className="mb-6 pb-4 border-b border-gray-800/80">
            <h1 className="text-2xl font-bold text-white tracking-tight">Add New Visitor</h1>
            <p className="text-xs text-gray-400 mt-1">
              Fill in the visitor details below to register a new campus visit.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@example.com"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Company / Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Host */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Host / Person to Meet *
                </label>
                <input
                  type="text"
                  name="host"
                  required
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="e.g. Hitesh Choudhary"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  name="visitDate"
                  required
                  value={formData.visitDate}
                  onChange={handleChange}
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Purpose of Visit *
              </label>
              <textarea
                name="purpose"
                required
                rows={3}
                value={formData.purpose}
                onChange={handleChange}
                placeholder="e.g. Project discussion & client interview"
                className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-sm font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-purple-600/30 border border-purple-500/50 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Submit Visitor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddVisitor;