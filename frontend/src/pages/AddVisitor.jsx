import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Webcam from "react-webcam";
import { Camera, RefreshCw, X, Image as ImageIcon } from "lucide-react";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

function AddVisitor() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // 📸 Webcam States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef(null);

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
  const [success, setSuccess] = useState("");

  const getAuthHeader = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      return userData?.token ? { Authorization: `Bearer ${userData.token}` } : {};
    } catch {
      return {};
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 📁 Manual File Select Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 📸 Base64 String ko File Object mein convert karne ka utility function
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
        setPhoto(file);
        setIsCameraOpen(false);
      }
    }
  }, [webcamRef]);

  // 🗑️ Clear Photo
  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("mobile", formData.mobile);
      data.append("email", formData.email);
      data.append("company", formData.company);
      data.append("purpose", formData.purpose);
      data.append("host", formData.host);
      data.append("visitDate", formData.visitDate);

      if (photo) {
        data.append("photo", photo);
      }

      await axios.post("/api/visitor", data, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });

      

      setSuccess("Visitor added successfully!");
      setFormData({
        name: "",
        mobile: "",
        email: "",
        company: "",
        host: "",
        visitDate: "",
        purpose: "",
      });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add visitor");
    } fontFinally: {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans p-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>
        </div>

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

          {success && (
            <div className="mb-6 p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-sm rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

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

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Host / Person to Meet
                </label>
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="e.g. Hitesh Choudhary"
                  className="w-full bg-gray-900/80 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

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

            {/* 📸 Visitor Photo Section (File Upload + Webcam Capture) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Visitor Photo
              </label>

              <div className="space-y-3">
                {/* Photo Preview Card */}
                {photoPreview ? (
                  <div className="flex items-center gap-4 bg-gray-900/80 border border-gray-800 p-3 rounded-lg">
                    <img
                      src={photoPreview}
                      alt="Visitor Preview"
                      className="w-16 h-16 rounded-lg object-cover border border-purple-500/40"
                    />
                    <div className="flex-1 text-xs text-gray-400">
                      <p className="text-gray-200 font-medium">Photo Attached</p>
                      <p>{photo?.name || "Webcam Capture"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="px-3 py-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Manual Upload */}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900/80 border border-gray-800 rounded-lg text-sm text-gray-300 hover:border-purple-500/50 cursor-pointer transition">
                      <ImageIcon size={16} className="text-purple-400" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Open Webcam Button */}
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition cursor-pointer"
                    >
                      <Camera size={16} />
                      Take Live Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-purple-600/30 border border-purple-500/50 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registering..." : "Submit Visitor"}
              </button>
            </div>
          </form>
        </div>
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

export default AddVisitor;