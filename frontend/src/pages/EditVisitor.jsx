import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function EditVisitor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Full Schema State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    company: "",
    host: "",
    purpose: "",
    visitDate: "",
    status: "Pending",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Fetch & Pre-fill Existing Data
  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        const token = userData?.token;

        const response = await axios.get(`http://localhost:4000/api/visitor/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        const formattedDate = data.visitDate
          ? new Date(data.visitDate).toISOString().split("T")[0]
          : "";

        setFormData({
          name: data.name || "",
          mobile: data.mobile || "",
          email: data.email || "",
          company: data.company || "",
          host: data.host || "",
          purpose: data.purpose || "",
          visitDate: formattedDate,
          status: data.status || "Pending",
        });
      } catch (err) {
        console.error("Error fetching visitor:", err);
        setError("Failed to load visitor details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVisitor();
    }
  }, [id]);

  // 2. Dynamic Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 3. Submit Update Handler (PUT Request)
  // 3. Submit Update Handler (PUT Request)
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    const token = userData?.token;

    // Relative path specify karein (Jaise GET me chala tha):
    await axios.patch(`/api/visitor/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Success redirect
    navigate(`/visitors/${id}`);
  } catch (err) {
    console.error("Error updating visitor:", err);
    
    setError(
      err.response?.data?.error || 
      err.response?.data?.message || 
      "Failed to update visitor."
    );
  }
};

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-gray-500 animate-pulse text-center">Loading visitor data for editing...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Visitor</h1>
        <button
          type="button"
          onClick={() => navigate(`/visitors/${id}`)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Styled Card Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Mobile & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number *
            </label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Company & Host */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host / Person to Meet *
            </label>
            <input
              type="text"
              name="host"
              value={formData.host}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Visit Date & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visit Date
            </label>
            <input
              type="date"
              name="visitDate"
              value={formData.visitDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose of Visit *
          </label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/visitors/${id}`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-sm"
          >
            Update Visitor
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditVisitor;