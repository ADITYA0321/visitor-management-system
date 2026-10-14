import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Webcam from "react-webcam";
import { Camera, RefreshCw, X, Image as ImageIcon } from "lucide-react";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

const BASE_URL = "http://localhost:4000";

function EditVisitor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Text Form Data State
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

  // Photo States
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // 📸 Webcam States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getAuthToken = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      return userData?.token || "";
    } catch {
      return "";
    }
  };

  // 1. Fetch & Pre-fill Existing Data
  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const token = getAuthToken();

        // 🔴 Fixed plural path: /api/visitors/${id}
        const response = await axios.get(`${BASE_URL}/api/visitor/${id}`, {
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

        setCurrentPhoto(data.photo || "");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 📁 Manual File Select Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 📸 Base64 String to File Utility
  const urlToFile = async (url, filename, mimeType) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  // 📷 Capture Snapshot from Webcam
  const capturePhoto = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhotoPreview(imageSrc);
        const file = await urlToFile(imageSrc, `visitor_${Date.now()}.jpg`, "image/jpeg");
        setNewPhoto(file);
        setIsCameraOpen(false);
      }
    }
  }, [webcamRef]);

  // 🗑️ Clear New Photo Selection
  const clearNewPhoto = () => {
    setNewPhoto(null);
    setPhotoPreview(null);
  };

  // 2. Submit Update Handler with Multipart/Form-Data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const token = getAuthToken();

      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (newPhoto) {
        data.append("photo", newPhoto);
      }

      // 🔴 Fixed plural path: /api/visitors/${id}
      await axios.patch(`${BASE_URL}/api/visitor/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      navigate(`/visitors/${id}`);
    } catch (err) {
      console.error("Error updating visitor:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update visitor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    return photoPath.startsWith("http") ? photoPath : `${BASE_URL}${photoPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <p className="text-purple-400 animate-pulse text-sm font-medium">
          Loading visitor data for editing...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans p-6">
      {/* 🌌 Ambient Glowing Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Edit Visitor</h1>
            <p className="text-xs text-gray-400 mt-1">Update visitor details and photo.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/visitors/${id}`)}
            className="text-sm font-medium text-gray-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#161b22]/90 backdrop-blur-md p-6 rounded-xl border border-gray-800/80 shadow-2xl space-y-5"
        >
          {/* 📸 Photo Preview & Dual Upload Options */}
          <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800/80 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0 flex items-center justify-center relative">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="New Preview"
                  className="w-full h-full object-cover"
                />
              ) : currentPhoto ? (
                <img
                  src={getPhotoUrl(currentPhoto)}
                  alt="Current Visitor"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-gray-500">No Photo</span>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Change Visitor Photo
              </label>

              {newPhoto ? (
                <div className="flex items-center justify-between bg-gray-900 border border-gray-800 p-2.5 rounded-lg">
                  <span className="text-xs text-purple-300 font-medium truncate">
                    {newPhoto.name || "Webcam Photo Selected"}
                  </span>
                  <button
                    type="button"
                    onClick={clearNewPhoto}
                    className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-300 hover:border-purple-500/50 cursor-pointer transition">
                    <ImageIcon size={14} className="text-purple-400" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-600/30 transition cursor-pointer"
                  >
                    <Camera size={14} />
                    Live Photo
                  </button>
                </div>
              )}

              <p className="text-[11px] text-gray-500">
                Leave unchanged if you don't want to replace the current photo.
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Mobile & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Mobile Number *
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          {/* Company & Host */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Host / Person to Meet *
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                required
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          {/* Visit Date & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Visit Date
              </label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition cursor-pointer"
              >
                <option value="Pending" className="bg-gray-900 text-amber-400">Pending</option>
                <option value="Approved" className="bg-gray-900 text-emerald-400">Approved</option>
                <option value="Checked In" className="bg-gray-900 text-blue-400">Checked In</option>
                <option value="Checked Out" className="bg-gray-900 text-gray-400">Checked Out</option>
                <option value="Rejected" className="bg-gray-900 text-rose-400">Rejected</option>
              </select>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Purpose of Visit *
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              rows="3"
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => navigate(`/visitors/${id}`)}
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800/60 hover:bg-gray-800 hover:text-white rounded-lg transition cursor-pointer border border-gray-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Visitor"}
            </button>
          </div>
        </form>
      </div>

      {/* 📹 Live Webcam Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Camera size={16} className="text-purple-400" />
                Capture Live Photo
              </h3>
              <button
                type="button"
                onClick={() => setIsCameraOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-black/50 flex flex-col items-center">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-800 bg-black">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-[#161b22]">
              <button
                type="button"
                onClick={() => setIsCameraOpen(false)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Camera size={14} />
                Capture & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditVisitor;