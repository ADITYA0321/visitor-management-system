import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useAuth();

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post("/api/user/login", {
        email,
        password,
      });

      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      navigate("/dashboard");
    } catch (err) {
      // 🚨 Error text persistent rakho aur log bhi check karo
      console.error("Login failed:", err);
      const serverMsg = err.response?.data?.error || "Invalid email or password";
      setError(serverMsg);
    }
  };

  return (
    // Outer Wrapper with Dark Ambient Background
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden font-sans flex items-center justify-center p-6">
      {/* 🌌 Ambient Glowing Purple Gradient Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-900/30 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-indigo-600/20 blur-[110px] rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#161b22]/90 backdrop-blur-md rounded-2xl border border-gray-800/80 p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Card Title Header */}
          <div className="text-center mb-2">
            <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-purple-900/40">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Visitor Pass Management
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Enter your credentials to access the portal
            </p>
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-gray-900/80 border border-gray-800 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-900/80 border border-gray-800 p-2.5 pr-10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-purple-400 transition focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <p className="text-rose-400 text-xs text-center font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg transition shadow-lg shadow-purple-600/30 border border-purple-500/50 mt-2 text-sm"
          >
            Login
          </button>
        </form>
      </div>
            {/* Copyright Footer */}
      <footer className="absolute bottom-4 left-0 w-full text-center px-4">
        <p className="text-xs text-gray-500">
          © 2026 Visitor Pass | Developed by{" "}
          <span className="text-gray-300 font-medium">
            Aditya Rangari
          </span>
          . All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default Login;
