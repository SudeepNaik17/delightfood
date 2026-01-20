import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie"; // Ensure you've run: npm install js-cookie

/**
 * RENDER DEPLOYMENT CONFIGURATION
 * Automatically switches between local and production backend URLs
 */
const API = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "https://delightfood-r9vx.onrender.com/api"; // REPLACE with your actual Render Backend URL

export default function AuthPage() {
  const navigate = useNavigate();

  // --- State Management ---
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Instant check: If token exists, skip login page
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (token) {
      navigate(savedRole === "admin" ? "/admin" : "/", { replace: true });
    }
  }, [navigate]);

  // 2. Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- Auth Logic ---
  const handleAuth = async (e) => {
    e.preventDefault(); 
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isLogin) {
        // --- CRITICAL SESSION SAVING ---
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        
        // Save email in Cookie for the Menu & History to use
        // secure: true is required if your Render site uses HTTPS
        Cookies.set("user_email", email.toLowerCase().trim(), { 
            expires: 7,
            secure: window.location.protocol === 'https:',
            sameSite: 'strict'
        });

        const target = data.role === "admin" ? "/admin" : "/";
        navigate(target, { replace: true });
      } else {
        setSuccess("Account created! Please sign in.");
        setIsLogin(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Connection failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {success && <div className="toast">{success}</div>}

      <div className="auth-card">
        <header className="auth-header">
          <span className="brand-icon">🍔</span>
          <h1>{isLogin ? "Welcome Back" : "Join Us"}</h1>
          <p>{isLogin ? "Sign in to your account" : "Create a new account"}</p>
        </header>

        <div className="toggle-wrapper">
          <div className={`slider-bg ${isLogin ? "pos-left" : "pos-right"}`} />
          <button 
            type="button" 
            className={`toggle-btn ${isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Login
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${!isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="form-group">
            <label>I am a...</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Student / User</option>
              <option value="admin">Cafeteria Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login Now" : "Register Now"}
          </button>
        </form>

        <p className="auth-footer">
          {isLogin ? "Don't have an account?" : "Already registered?"}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? " Create One" : " Sign In"}
          </span>
        </p>
      </div>

      <style>{`
        .auth-container {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #dc2626, #7f1d1d);
          font-family: 'Segoe UI', system-ui, sans-serif;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }

        .auth-container * { box-sizing: border-box; }

        .toast {
          position: fixed;
          top: 30px;
          right: 30px;
          background: #10b981;
          color: white;
          padding: 12px 25px;
          border-radius: 8px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .auth-card {
          background: white;
          width: 100%;
          max-width: 380px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
          text-align: center;
        }

        .brand-icon { font-size: 45px; display: block; margin-bottom: 10px; }
        .auth-header h1 { margin: 0; color: #111; font-size: 24px; }
        .auth-header p { color: #666; font-size: 14px; margin-top: 5px; }

        .toggle-wrapper {
          position: relative;
          display: flex;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 50px;
          margin: 25px 0;
        }

        .slider-bg {
          position: absolute;
          width: calc(50% - 4px);
          height: calc(100% - 8px);
          background: #dc2626;
          border-radius: 50px;
          transition: transform 0.3s ease;
        }

        .pos-left { transform: translateX(0); }
        .pos-right { transform: translateX(100%); }

        .toggle-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 10px;
          font-weight: 700;
          cursor: pointer;
          z-index: 1;
          color: #666;
          transition: 0.3s;
        }

        .toggle-btn.active { color: white; }

        .form-group { text-align: left; margin-bottom: 15px; }
        .form-group label { display: block; font-size: 12px; font-weight: 800; color: #444; text-transform: uppercase; margin-bottom: 6px; }
        
        input, select {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
        }

        input:focus { border-color: #dc2626; }

        .error-banner {
          background: #fee2e2;
          color: #b91c1c;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 15px;
          border: 1px solid #fecaca;
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .submit-btn:hover { background: #b91c1c; }
        .submit-btn:disabled { background: #9ca3af; }

        .auth-footer { margin-top: 20px; font-size: 14px; color: #666; }
        .auth-footer span { color: #dc2626; font-weight: 800; cursor: pointer; }
      `}</style>
    </div>
  );
}