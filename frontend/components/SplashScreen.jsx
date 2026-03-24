// Pure display component — NO hooks, NO context, safe to render anywhere
export default function SplashScreen() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0a0e1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
        fontFamily: "Inter, system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: 340,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "25%",
          right: "28%",
          width: 280,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(79,70,229,0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          animation: "fadeUp 0.6s ease both",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow:
              "0 0 0 1px rgba(99,102,241,0.2), 0 12px 48px rgba(99,102,241,0.25), 0 4px 16px rgba(0,0,0,0.5)",
            flexShrink: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 180 180"
            width="88"
            height="88"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="sp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a0e1a" />
                <stop offset="100%" stopColor="#0f1528" />
              </linearGradient>
              <linearGradient id="sp-s" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="sp-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
              </linearGradient>
              <filter id="sp-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="sp-dot" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="180" height="180" rx="0" fill="url(#sp-bg)" />
            <ellipse cx="50" cy="45" rx="55" ry="40" fill="#6366f1" opacity="0.04" />
            <ellipse cx="135" cy="140" rx="50" ry="38" fill="#4f46e5" opacity="0.05" />
            <circle cx="90" cy="90" r="74" fill="none" stroke="url(#sp-ring)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
            <circle cx="90" cy="90" r="68" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.2" />
            <polygon points="90,44 130,67 130,113 90,136 50,113 50,67" fill="#111827" stroke="#2a3450" strokeWidth="1.5" />
            <polyline points="90,44 130,67 130,113" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.35" />
            <text x="90" y="111" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize="74" fontWeight="700" fill="#3730a3" opacity="0.6" dx="1" dy="2">S</text>
            <text x="90" y="111" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize="74" fontWeight="700" fill="url(#sp-s)" filter="url(#sp-glow)">S</text>
            <circle cx="90" cy="16" r="5" fill="#6366f1" filter="url(#sp-dot)" />
            <circle cx="90" cy="16" r="3" fill="#a5b4fc" />
            <circle cx="164" cy="90" r="4.5" fill="#10b981" filter="url(#sp-dot)" />
            <circle cx="164" cy="90" r="2.5" fill="#6ee7b7" />
            <circle cx="90" cy="164" r="4.5" fill="#f59e0b" filter="url(#sp-dot)" />
            <circle cx="90" cy="164" r="2.5" fill="#fcd34d" />
            <circle cx="16" cy="90" r="4.5" fill="#3b82f6" filter="url(#sp-dot)" />
            <circle cx="16" cy="90" r="2.5" fill="#93c5fd" />
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f1f5f9",
              lineHeight: 1,
            }}
          >
            SahilOS
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#475569",
            }}
          >
            Personal Operating System
          </span>
        </div>

        {/* Loading bar */}
        <div
          style={{
            width: 120,
            height: 2,
            borderRadius: 99,
            background: "rgba(99,102,241,0.15)",
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 99,
              background: "linear-gradient(90deg, #6366f1, #818cf8)",
              animation: "loadBar 1.6s ease-in-out infinite",
              transformOrigin: "left",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          0%   { width: 0%;   opacity: 1; }
          60%  { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}