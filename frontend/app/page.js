import { redirect } from "next/navigation";

// OG metadata lives here — on the public root — so scrapers see it
export const metadata = {
  title: "SahilOS — Personal Life & Career OS",
  description: "Your personal operating system. Tasks, projects, habits, journal, budget, and AI assistant — all in one place.",
  metadataBase: new URL("https://sahilos.vercel.app"),
  openGraph: {
    title: "SahilOS — Personal Operating System",
    description: "Tasks, projects, habits, journal, budget, AI assistant — all in one place.",
    url: "https://sahilos.vercel.app",
    siteName: "SahilOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SahilOS — Personal Operating System",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SahilOS — Personal Operating System",
    description: "Tasks, projects, habits, journal, budget, AI assistant — all in one place.",
    images: ["/og-image.png"],
  },
};

export default function RootPage() {
  redirect("/dashboard");
}