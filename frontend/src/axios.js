import axios from "axios";

// 🚨 Global response interceptor for 401 Unauthorized
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/api/user/login");

    // Agar 401 aaya hai AUR wo login request NAHI hai (matlab session expire hua hai)
    if (error.response?.status === 401 && !isLoginRequest) {
      setTimeout(() => {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }, 2000); // ⏱️ 2 Seconds delay user ko notification padhne dene ke liye
    }

    return Promise.reject(error);
  }
);

export default axios;