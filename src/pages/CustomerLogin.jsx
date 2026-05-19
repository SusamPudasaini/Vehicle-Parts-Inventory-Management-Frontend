import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env.");
}

export default function CustomerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/customer-auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Customer login failed.");

      login(data);
      navigate("/customer/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--purple-950)",
    }}>
      <div style={{
        position: "fixed",
        inset: 0,
        opacity: 0.04,
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: "400px", padding: "16px", position: "relative" }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <BrandLogo size={56} showText={false} style={{ justifyContent: "center", marginBottom: "12px" }} />
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "white", margin: "0 0 4px" }}>
            VehicleParts
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
            Customer Portal
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "14px",
          padding: "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1523", margin: "0 0 4px" }}>
              Customer sign in
            </h2>
            <p style={{ fontSize: "12.5px", color: "#7c6f96", margin: 0 }}>
              Access your profile, vehicles, and service records.
            </p>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              fontSize: "13px",
              color: "#be123c",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              placeholder="your@email.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              placeholder="Password"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                background: loading ? "var(--purple-400)" : "var(--purple-600)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                marginTop: "4px",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
          New customer?{" "}
          <Link to="/customer-register" style={{ color: "white", fontWeight: 600, textDecoration: "none" }}>
            Create an account
          </Link>
        </p>
        <p style={{ textAlign: "center", marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
          Staff or admin?{" "}
          <Link to="/login" style={{ color: "white", fontWeight: 600, textDecoration: "none" }}>
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "5px" }}>
        {label}
      </label>
      <input
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          fontSize: "13.5px",
          color: "#1a1523",
          fontFamily: "inherit",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--purple-400)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
  );
}
