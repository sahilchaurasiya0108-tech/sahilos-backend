import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sahilos.vercel.app";

// ── viewport (Next.js 14 requirement) ─────────────────────────────
export const viewport = {
  themeColor: "#6366f1",
};

// ── GLOBAL metadata ONLY (no OG here) ─────────────────────────────
export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "SahilOS — Personal OS",
    template: "%s | SahilOS",
  },

  description:
    "Your personal operating system. Tasks, projects, habits, journal, budget, AI assistant — all in one place.",

  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e2535",
                color: "#f1f5f9",
                border: "1px solid #252d40",
                borderRadius: "10px",
                fontSize: "13px",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#1e2535" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#1e2535" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}