/**
 * seed-new-projects.js
 * Adds Tofly Media and Attendance App projects to SahilOS.
 * Run: node seed-new-projects.js  (while backend is running)
 */

const http = require("http");

const EMAIL    = "chaurasiyasahil18@gmail.com";
const PASSWORD = "Sahil@gauri1981";

// ── Project definitions ───────────────────────────────────────────────────────

const PROJECTS = [
  {
    title: "Tofly Media — Digital Marketing Agency Website",
    description:
      "A full-stack website for Tofly Media, a digital marketing agency delivering performance-driven growth for 200+ clients. Features a public-facing site with services, case studies, blog, testimonials, and a contact/lead capture system — plus a full admin dashboard to manage all content: blogs (rich editor), services, case studies, testimonials, and leads. Built with React (Vite) + Node.js/Express + MongoDB. Includes SEO-optimised pages, Helmet metadata, animated UI with Framer Motion, and a complete CMS-style admin panel behind JWT auth.",
    status: "active",
    repoLink: "https://github.com/sahil-chaurasiya/tofly.git",
    liveUrl: "https://toflymediaa.com/",
    color: "#f59e0b", // amber — media/marketing energy
    categories: ["freelance", "office"],
    milestones: [
      { title: "Project Architecture & Tech Stack Setup",         done: true  },
      { title: "Public Homepage & Hero Section",                  done: true  },
      { title: "Services Page & Service Detail Pages",            done: true  },
      { title: "Case Studies Listing & Detail Pages",             done: true  },
      { title: "Blog System (List + Detail + Rich Editor)",       done: true  },
      { title: "Testimonials Section",                            done: true  },
      { title: "Contact Form & Lead Capture API",                 done: true  },
      { title: "Admin Dashboard — Login & Auth",                  done: true  },
      { title: "Admin — Leads Management",                        done: true  },
      { title: "Admin — Blog / Case Study / Services CRUD",       done: true  },
      { title: "SEO — Helmet Metadata & OG Tags",                 done: true  },
      { title: "Animations — Framer Motion Integration",          done: true  },
      { title: "Deployment & Domain Setup",                       done: true  },
      { title: "Performance Audit & Optimisation",                done: false },
    ],
    notes:
      "Client: Tofly Media (toflymediaa.com). Built for the agency's own digital presence. Admin panel allows non-technical staff to manage all content without touching code. Lead capture sends enquiries directly to the admin panel. Potential future additions: email notifications for new leads, analytics dashboard, Instagram feed integration.",
  },
  {
    title: "Office Attendance Management System",
    description:
      "A full-stack PWA-based office attendance system built for Tofly Media. Employees check in/out via GPS geofencing (must be within office radius), with real-time admin dashboards, WFH request management, and automated daily attendance marking via cron jobs. Features role-based access (admin/employee), push notifications via Web Push, Excel report exports, and offline support through a service worker. Built with React (Vite) + Node.js/Express + MongoDB.",
    status: "active",
    repoLink: "https://github.com/sahil-chaurasiya/attendance-app.git",
    liveUrl: "https://attendance.toflymediaa.com/",
    color: "#3b82f6", // blue — professional/office
    categories: ["freelance", "office"],
    milestones: [
      { title: "Project Architecture & Planning",                        done: true  },
      { title: "MongoDB Schema — User, Attendance, WFH, PushSub",       done: true  },
      { title: "Auth System — JWT, Role-based (Admin / Employee)",       done: true  },
      { title: "GPS Geofencing — Check-in/out within office radius",     done: true  },
      { title: "Employee Dashboard — Daily check-in UI",                 done: true  },
      { title: "Admin Dashboard — Live attendance overview",             done: true  },
      { title: "WFH Request System — Apply, Approve/Reject flow",        done: true  },
      { title: "Automated Cron — Auto-mark absent after cutoff",         done: true  },
      { title: "Push Notifications via Web Push API",                    done: true  },
      { title: "Excel Export — Attendance reports",                      done: true  },
      { title: "PWA — Service Worker, Manifest, Offline Page",          done: true  },
      { title: "Employee Attendance History & Profile",                  done: true  },
      { title: "Admin — Employee CRUD Management",                       done: true  },
      { title: "Deployment on attendance.toflymediaa.com",               done: true  },
      { title: "Location Spoofing Detection",                            done: false },
      { title: "Monthly Payroll Summary Export",                         done: false },
    ],
    notes:
      "Built for Tofly Media's internal office operations. Employees must be physically within the geofenced office zone to mark attendance. WFH requests go through an admin approval workflow. Cron jobs automatically mark employees absent if they haven't checked in by a configurable time. Future: location spoofing detection, payroll summary, leave management module.",
  },
];

// ── HTTP helper ───────────────────────────────────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": data ? Buffer.byteLength(data) : 0,
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try   { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        reject(new Error(
          "Cannot connect to localhost:5000 — is the backend running?\n" +
          "Open a separate terminal in the backend folder and run: npm run dev"
        ));
      } else {
        reject(err);
      }
    });

    if (data) req.write(data);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 SahilOS — New Projects Seed");
  console.log("================================\n");

  // Health check
  await request("GET", "/api/health").catch((err) => {
    console.error("❌ " + err.message);
    process.exit(1);
  });
  console.log("✅ Backend is running\n");

  // Login
  console.log("📧 Logging in as " + EMAIL + "...");
  const loginRes = await request("POST", "/api/auth/login", { email: EMAIL, password: PASSWORD });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error("❌ Login failed:", loginRes.body.message || JSON.stringify(loginRes.body));
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log("✅ Logged in as " + (loginRes.body.user?.name || "Sahil") + "\n");

  // Create projects
  for (const project of PROJECTS) {
    console.log(`📁 Creating: "${project.title}"...`);

    const res = await request("POST", "/api/projects", project, token);

    if (res.status === 201) {
      const p = res.body.data;
      console.log(`   ✅ Created  — ID: ${p._id}`);
      console.log(`   📊 Progress : ${p.progress}%`);
      console.log(`   🏷️  Categories: ${p.categories.join(", ")}`);
      console.log(`   🔗 Repo     : ${p.repoLink}`);
      console.log(`   🌐 Live     : ${p.liveUrl}`);
      console.log(`   🪨 Milestones: ${p.milestones.length} (${p.milestones.filter(m => m.done).length} done)\n`);
    } else {
      console.error(`   ❌ Failed (${res.status}):`, res.body?.message || JSON.stringify(res.body));
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 Done! Both projects are now in SahilOS.");
  console.log("→ Open Projects → filter by 'Freelance' or 'Office' to see them.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});