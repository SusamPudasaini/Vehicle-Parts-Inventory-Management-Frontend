const LOGO_SRC = "/Vehicle-Parts-Mgmt-logo.png";

export default function BrandLogo({ size = 36, showText = true, textColor = "white", subtitle = "Management", style = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, ...style }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: Math.max(8, Math.round(size * 0.25)),
        overflow: "hidden",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
        flexShrink: 0,
      }}>
        <img
          src={LOGO_SRC}
          alt="Vehicle Parts Management"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
      {showText && (
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: "600", color: textColor, lineHeight: 1.2, margin: 0 }}>
            VehicleParts
          </p>
          <p style={{ fontSize: "11px", color: textColor === "white" ? "rgba(255,255,255,0.45)" : "#7c6f96", lineHeight: 1.2, margin: 0 }}>
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}

