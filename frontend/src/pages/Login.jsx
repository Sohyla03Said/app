import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { LogIn, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo.png";
import "../Welcome.css";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Hydrate token if present in localStorage
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authAPI
        .getMe()
        .then((res) => {
          setAuth(res.data, token);
          navigate("/dashboard");
        })
        .catch(() => {
          localStorage.removeItem("access_token");
        });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { access_token, user } = response.data;

      localStorage.setItem("access_token", access_token);
      setAuth(user, access_token);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      {/* Sparkles */}
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

      <div className="decorative-dot dot-1" />
      <div className="decorative-dot dot-2" />
      <div className="decorative-dot dot-3" />

      <div
        className="main-card"
        style={{
          maxWidth: "700px",
          padding: "50px 60px",
          maxHeight: "690px",
        }}
      >
        {/* Logo */}
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

        <div className="content-wrapper">
          <h1 className="title" style={{ marginBottom: "12px" }}>
            Welcome <span className="title-accent">Back</span>
          </h1>

          <p className="tagline" style={{ marginBottom: "12px" }}>
            Sign in to access your offline AI study assistant
          </p>

          <p className="tagline-subtext" style={{ marginBottom: "28px" }}>
            Fully offline · Zero servers · Absolute privacy
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div
              className="description-card space-y-5"
              style={{ padding: "25px 30px" ,height: "210px", width:"450px" }}
            >
              {/* Username */}
              <div>
                <label className="block text-md font-medium text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-4 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <br></br>

              {/* Password */}
              <div>
                <label className="block text-md font-medium text-slate-300 mb-2">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-4 pr-12 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                  <br></br>

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-0 bg-transparent border-0"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-slate-400 hover:text-white transition-colors duration-200" />
                    ) : (
                      <Eye size={18} className="text-slate-400 hover:text-white transition-colors duration-200" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <br></br>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="start-button w-full flex items-center justify-center gap-2"
              style={{
                padding: "16px 0",
                fontSize: "16px",
                fontWeight: 600,
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                boxShadow: "0 8px 28px rgba(59, 130, 246, 0.45)",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
              <LogIn className="w-5 h-5 text-white" />
            </button>
          </form>

          <p className="mt-6 text-center text-md text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
