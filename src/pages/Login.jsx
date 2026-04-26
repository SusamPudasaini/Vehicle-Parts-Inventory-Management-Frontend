import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "https://localhost:7193/api";

export default function Login() {
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
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");
      login(data);
      if (data.role === "Admin") navigate("/admin/staff");
      else navigate("/staff/customers");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--purple-950)",
    }}>
      {/* Background pattern */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: "380px", padding: "16px",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "48px", height: "48px", margin: "0 auto 12px",
            background: "linear-gradient(135deg, var(--purple-500), var(--accent))",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: "700", color: "white",
          }}>
            VP
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "white", margin: "0 0 4px" }}>
            VehicleParts
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "white", borderRadius: "14px", padding: "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1523", margin: "0 0 20px" }}>
            Sign in
          </h2>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
              background: "#fff1f2", border: "1px solid #fecdd3",
              fontSize: "13px", color: "#be123c",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "5px" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="your@email.com"
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "1px solid var(--border)", borderRadius: "8px",
                  fontSize: "13.5px", color: "#1a1523", fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple-400)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "5px" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "9px 12px",
                  border: "1px solid var(--border)", borderRadius: "8px",
                  fontSize: "13.5px", color: "#1a1523", fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple-400)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%", padding: "10px",
                background: loading ? "var(--purple-400)" : "var(--purple-600)",
                color: "white", border: "none", borderRadius: "8px",
                fontSize: "13.5px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", marginTop: "4px",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>
          CS6004 · Group Project
        </p>
      </div>
    </div>
  );
}
