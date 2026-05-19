import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env.");
}

export default function CustomerVerifyEmail({ type = "customer" }) {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const lastTokenRef = useRef(null);
  const isStaff = type === "staff";

  useEffect(() => {
    const token = params.get("token");

    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing. Please use the link from your email.");
        lastTokenRef.current = null;
        return;
      }

      if (token === lastTokenRef.current) {
        return;
      }

      lastTokenRef.current = token;

      try {
        const endpoint = isStaff
          ? `/auth/verify-staff-email?token=${encodeURIComponent(token)}`
          : `/customer-auth/verify-email?token=${encodeURIComponent(token)}`;

        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "This verification link is invalid or has expired.");
        }

        setStatus("success");
        setMessage(data.message || "Email verified successfully. You can now log in.");
      } catch (e) {
        setStatus("error");
        setMessage(e.message || "We could not verify your email. Please try again.");
      }
    }

    verifyEmail();
  }, [params, isStaff]);

  const isSuccess = status === "success";
  const isLoading = status === "loading";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--purple-950)",
      padding: "20px",
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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: "430px", position: "relative" }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <BrandLogo size={58} showText={false} style={{ justifyContent: "center", marginBottom: "12px" }} />
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "white", margin: "0 0 4px" }}>
            VehicleParts
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
            {isStaff ? "Staff Portal" : "Customer Portal"}
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "14px",
          padding: "30px",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isLoading ? "var(--purple-50)" : isSuccess ? "#f0fdf4" : "#fff1f2",
            color: isLoading ? "var(--purple-600)" : isSuccess ? "#15803d" : "#be123c",
          }}>
            {isLoading && <Loader2 size={25} strokeWidth={2.2} className="spin-icon" />}
            {isSuccess && <CheckCircle2 size={27} strokeWidth={2.2} />}
            {status === "error" && <AlertCircle size={27} strokeWidth={2.2} />}
          </div>

          <h2 style={{ fontSize: "17px", fontWeight: "650", color: "#1a1523", margin: "0 0 8px" }}>
            {isLoading ? "Verifying email" : isSuccess ? "Email verified" : "Verification failed"}
          </h2>
          <p style={{ fontSize: "13.5px", color: "#6d5d8a", lineHeight: 1.55, margin: "0 0 22px" }}>
            {message}
          </p>

          <Link
            to={isStaff ? "/login" : "/customer-login"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "38px",
              padding: "0 18px",
              borderRadius: "8px",
              background: "var(--purple-600)",
              color: "white",
              textDecoration: "none",
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          >
            {isStaff ? "Go to staff login" : "Go to customer login"}
          </Link>
        </div>
      </motion.div>

      <style>{`
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
