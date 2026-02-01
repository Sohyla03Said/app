import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { UserPlus, GraduationCap, Users, Sparkles, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo.png";
import "../Welcome.css"; // Reuse Welcome styles for consistency

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      const { access_token, user } = response.data;

      localStorage.setItem("token", access_token);
      setAuth(user, access_token);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      {/* Galaxy Sparkles */}
      <div className="sparkles">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${14 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative Galaxy Orbs */}
      <div className="decorative-dot dot-1" />
      <div className="decorative-dot dot-2" />
      <div className="decorative-dot dot-3" />

      {/* Main Card */}
      <div
        className="main-card"
        style={{ maxWidth: "700px", padding: "50px 60px", maxHeight: "690px" }}
      >
        {/* Logo Section */}
        <div className="logo-section" style={{ marginBottom: "30px" }}>
          <div className="logo-outer-ring">
            <div className="logo-inner-circle">
              <img
                src={logo}
                alt="StudyBuddy AI Logo"
                className="logo-image"
              />
            </div>
          </div>
          <div className="logo-glow-effect" />
        </div>

        {/* Title & Tagline */}
        <div className="content-wrapper">
          <h1 className="title" style={{ marginBottom: "12px", marginTop: "-20px" }}>
            Create Your <span className="title-accent">Account</span>
          </h1>

          <div className="tagline-container" style={{ marginBottom: "8px" }}>
            <p className="tagline">
              Join the future of offline AI-powered learning
            </p>
          </div>
          <p className="tagline-subtext" style={{ marginBottom: "20px" }}>
            Fully offline · Zero servers · Absolute privacy
          </p>

          {/* Form */}
          <div className="description-card" style={{ padding: "25px 30px", height: "310px", width: "450px" }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-11.5">
                <label className="text-sm font-medium text-slate-300 whitespace-nowrap min-w-[80px]">
                  Username
                </label>
                <input
                  type="text"
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ padding: "5px" }} />

              <div className="flex items-center gap-11.5">
                <label className="text-sm font-medium text-slate-300 whitespace-nowrap min-w-[80px]">
                  Email
                </label>
                <input
                  type="email"
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ padding: "5px" }} />

              <div className="flex items-center gap-11.5 relative">
                <label className="text-sm font-medium text-slate-300 whitespace-nowrap min-w-[80px]">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-0 bg-transparent border-0"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-slate-400 hover:text-white transition-colors duration-200" />
                  ) : (
                    <Eye size={18} className="text-slate-400 hover:text-white transition-colors duration-200" />
                  )}
                </button>
              </div>
              <div style={{ padding: "5px" }} />

              <div className="flex items-center gap-4 relative">
                <label className="text-sm font-medium text-slate-300 whitespace-nowrap min-w-[100px]">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 p-0 bg-transparent border-0"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} className="text-slate-400 hover:text-white transition-colors duration-200" />
                  ) : (
                    <Eye size={18} className="text-slate-400 hover:text-white transition-colors duration-200" />
                  )}
                </button>
              </div>
              <div style={{ padding: "5px" }} />

              <div>
                <label className="block text-md font-medium text-slate-300 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "student" })}
                    className={`p-2 rounded-lg border-2 transition-all duration-300 ${formData.role === "student"
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : "border-white/10 bg-slate-900/40 hover:bg-slate-800/60"
                      }`}
                  >
                    <GraduationCap className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <p className="text-sm font-medium text-slate-300">Student</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "teacher" })}
                    className={`p-2 rounded-lg border-2 transition-all duration-300 ${formData.role === "teacher"
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                      : "border-white/10 bg-slate-900/40 hover:bg-slate-800/60"
                      }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <p className="text-sm font-medium text-slate-300">Teacher</p>
                  </button>
                </div>
              </div>
              <br />
              <div style={{ padding: "5px" }} />
              <div style={{ padding: "5px" }} />

              <button
                type="submit"
                disabled={loading}
                className="start-button w-full h-5 flex items-center justify-center gap-2"
                style={{
                  padding: "16px 0",
                  fontSize: "16px",
                  fontWeight: 600,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  boxShadow: "0 8px 28px rgba(59, 130, 246, 0.45)",
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? "Creating account..." : "Sign Up"}
                <UserPlus className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>

          <br />
          {/* Footer */}
          <p className="mt-6 text-center text-md text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}