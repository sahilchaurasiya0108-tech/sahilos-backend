import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "SahilOS — Personal Life & Career OS",
  description: "Your personal life and career operating system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
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
              success: { iconTheme: { primary: "#10b981", secondary: "#1e2535" } },
              error:   { iconTheme: { primary: "#ef4444", secondary: "#1e2535" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
