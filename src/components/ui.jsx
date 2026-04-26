// ── Shared UI Components ──────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#1a1523", letterSpacing: "-0.02em", margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ marginTop: "4px", fontSize: "13.5px", color: "#7c6f96", margin: "4px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", type = "button", disabled, className = "", style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "8px 16px", borderRadius: "8px",
    fontSize: "13.5px", fontWeight: "500",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "none", outline: "none",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };

  const variants = {
    primary: {
      background: "var(--purple-600)",
      color: "white",
      boxShadow: "0 1px 3px rgba(109,40,217,0.3)",
    },
    secondary: {
      background: "white",
      color: "#4c3d6b",
      border: "1px solid var(--border)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },
    danger: {
      background: "#dc2626",
      color: "white",
    },
    ghost: {
      background: "transparent",
      color: "#6d5d8a",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "var(--purple-700)";
        if (variant === "secondary") e.currentTarget.style.background = "var(--purple-50)";
        if (variant === "ghost") e.currentTarget.style.background = "var(--purple-50)";
        if (variant === "danger") e.currentTarget.style.background = "#b91c1c";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        Object.assign(e.currentTarget.style, variants[variant]);
      }}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = "gray" }) {
  const colors = {
    gray: { background: "#f3f0fa", color: "#6d5d8a" },
    green: { background: "#f0fdf4", color: "#15803d" },
    red: { background: "#fff1f2", color: "#be123c" },
    blue: { background: "#eff6ff", color: "#1d4ed8" },
    purple: { background: "var(--purple-100)", color: "var(--purple-700)" },
    yellow: { background: "#fefce8", color: "#a16207" },
  };
  const s = colors[color] || colors.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: "99px",
      fontSize: "11.5px", fontWeight: "500",
      ...s,
    }}>
      {children}
    </span>
  );
}

export function Card({ children, className = "", style = {} }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      border: "1px solid var(--border)",
      boxShadow: "0 1px 4px rgba(109,40,217,0.04)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Input({ label, error, hint, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontSize: "13px", fontWeight: "500", color: "#4c3d6b" }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%", padding: "8px 12px",
          border: `1px solid ${error ? "#fca5a5" : "var(--border)"}`,
          borderRadius: "8px", fontSize: "13.5px",
          background: "white", color: "#1a1523",
          outline: "none", fontFamily: "inherit",
          boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--purple-400)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#fca5a5" : "var(--border)";
          e.currentTarget.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.1)" : "none";
        }}
        {...props}
      />
      {hint && !error && <p style={{ fontSize: "12px", color: "#9d8db8" }}>{hint}</p>}
      {error && <p style={{ fontSize: "12px", color: "#dc2626" }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {label && (
        <label style={{ fontSize: "13px", fontWeight: "500", color: "#4c3d6b" }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: "100%", padding: "8px 12px",
          border: `1px solid ${error ? "#fca5a5" : "var(--border)"}`,
          borderRadius: "8px", fontSize: "13.5px",
          background: "white", color: "#1a1523",
          outline: "none", fontFamily: "inherit",
          cursor: "pointer",
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
      >
        {children}
      </select>
      {error && <p style={{ fontSize: "12px", color: "#dc2626" }}>{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(46,16,101,0.35)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div style={{
        position: "relative", background: "white",
        borderRadius: "14px", width: "100%", maxWidth: "460px",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(46,16,101,0.2)",
        border: "1px solid var(--border)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px 16px",
          borderBottom: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1a1523", margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px", borderRadius: "6px", color: "#9d8db8",
              display: "flex", alignItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 20px", textAlign: "center",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "12px",
        background: "var(--purple-50)", border: "1px solid var(--purple-100)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", marginBottom: "14px",
      }}>
        {icon}
      </div>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#1a1523", margin: "0 0 4px" }}>{title}</p>
      <p style={{ fontSize: "13px", color: "#9d8db8", maxWidth: "260px", margin: "0 0 16px" }}>{description}</p>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
      <div style={{
        width: "28px", height: "28px",
        border: "2px solid var(--purple-100)",
        borderTopColor: "var(--purple-600)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Alert({ type = "error", message }) {
  if (!message) return null;
  const s = type === "error"
    ? { background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" }
    : { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
      ...s,
    }}>
      <span>{type === "error" ? "⚠" : "✓"}</span>
      <span>{message}</span>
    </div>
  );
}

// ── Table primitives ───────────────────────────────────────────────────────────
export function Table({ headers, children, empty }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {headers.map((h) => (
            <th key={h} style={{
              padding: "10px 16px", textAlign: "left",
              fontSize: "11px", fontWeight: "600",
              letterSpacing: "0.06em", textTransform: "uppercase",
              color: "#9d8db8",
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function TR({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      style={{ borderBottom: "1px solid var(--purple-50)", cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = "var(--purple-50)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </tr>
  );
}

export function TD({ children, muted, mono, style = {} }) {
  return (
    <td style={{
      padding: "11px 16px",
      color: muted ? "#9d8db8" : "#1a1523",
      fontFamily: mono ? "'DM Mono', monospace" : "inherit",
      fontSize: mono ? "12.5px" : "13.5px",
      ...style,
    }}>
      {children}
    </td>
  );
}

export function ActionButton({ onClick, variant = "edit", children }) {
  const s = variant === "delete"
    ? { color: "#dc2626" }
    : { color: "var(--purple-600)" };
  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "12.5px", fontWeight: "500", padding: "4px 8px",
        borderRadius: "5px", fontFamily: "inherit",
        ...s,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = variant === "delete" ? "#fff1f2" : "var(--purple-50)";
      }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
