import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env.");
}

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

export default function CustomerRegister() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.password.trim()) return "Password is required.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!/^\d{10,15}$/.test(form.phone.trim())) return "Phone must be 10 to 15 digits.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${BASE_URL}/customer-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Registration failed.");

      setSuccess(true);
      setMessage(data.message || "Registration successful. Please verify your email.");
      setForm(initialForm);
    } catch (e) {
      setError(e.message || "Registration failed.");
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
      padding: "24px",
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
        style={{ width: "100%", maxWidth: "520px", position: "relative" }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <BrandLogo size={56} showText={false} style={{ justifyContent: "center", marginBottom: "12px" }} />
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "white", margin: "0 0 4px" }}>
            VehicleParts
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
            Customer Registration
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "14px",
          padding: "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{ marginBottom: "18px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1523", margin: "0 0 4px" }}>
              Create your account
            </h2>
            <p style={{ fontSize: "12.5px", color: "#7c6f96", margin: 0 }}>
              Verify your email to access your vehicles and service history.
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

          {success && message && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              fontSize: "13px",
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <CheckCircle2 size={16} strokeWidth={2.2} />
              {message}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <IconField
                label="Full name"
                placeholder="Your full name"
                value={form.fullName}
                onChange={setField("fullName")}
                icon={User}
              />
            </div>
            <IconField
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={setField("email")}
              icon={Mail}
            />
            <IconField
              label="Phone"
              placeholder="98XXXXXXXX"
              value={form.phone}
              onChange={setField("phone")}
              icon={Phone}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <IconField
                label="Address"
                placeholder="Street, City"
                value={form.address}
                onChange={setField("address")}
                icon={MapPin}
              />
            </div>
            <IconField
              label="Password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={setField("password")}
              icon={Lock}
            />
            <IconField
              label="Confirm password"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={setField("confirmPassword")}
              icon={Lock}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "10px",
              background: loading ? "var(--purple-400)" : "var(--purple-600)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
          Already have an account?{" "}
          <Link to="/customer-login" style={{ color: "white", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function IconField({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "5px" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon
          size={16}
          strokeWidth={2.1}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9d8db8",
          }}
        />
        <input
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
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
    </div>
  );
}
