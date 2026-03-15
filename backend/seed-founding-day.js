/**
 * seed-founding-day.js
 * Moves the founding entry from 2025-03-13 to 2026-03-13
 * Run: node seed-founding-day.js  (while backend is running)
 */

const http = require("http");

const EMAIL    = "chaurasiyasahil18@gmail.com";
const PASSWORD = "Sahil@gauri1981";

const SEP = "\n" + "─".repeat(40) + "\n";

const CONTENT = [
  "# SahilOS — Day Zero",
  "",
  "Today, I built something I've been thinking about for a long time.",
  "",
  "Not just another to-do app. Not another habit tracker. Something bigger — a Personal Operating System. A single place where my entire life lives: my tasks, my projects, my learning, my job hunt, my budget, my thoughts, my habits. Everything in one place, designed exactly how I think.",
  "",
  "I'm calling it SahilOS.",
  SEP,
  "## Why I built this",
  "",
  "I've always felt scattered. Tasks in one app, notes in another, job applications in a spreadsheet, habits tracked manually, budgets in a calculator. Every day starts with opening six different tools just to understand what I need to do.",
  "",
  "That ends today.",
  "",
  "SahilOS is my answer. A full-stack personal command center, built from scratch in a single sitting, that I actually want to use every morning.",
  SEP,
  "## What I built today",
  "",
  "In the span of a few hours, this thing has:",
  "",
  "Task System — Full CRUD with priorities, statuses, subtasks, tags, project linking. List view AND kanban board.",
  "",
  "Project OS — Projects with milestone tracking, progress bars calculated automatically from milestone completion, repo links, notes, color coding.",
  "",
  "Habit Intelligence — Daily habits with streak tracking, longest streak records, weekly success rates. One tap to log today.",
  "",
  "Idea Vault — Capture startup ideas with ratings and tags. Convert any idea directly into a project with one click.",
  "",
  "Job Application CRM — A full kanban pipeline. Saved to Applied to Interview to Offer to Rejected. Every application tracked with company, role, salary, contact, follow-up dates.",
  "",
  "Learning Tracker — Skills, courses, and books with progress sliders. Status auto-syncs with progress.",
  "",
  "Budget — Income and expense tracking with category breakdowns, monthly summaries, and a balance calculator.",
  "",
  "Journal — What you're reading right now. A second brain. A reflection space. With mood tracking, AI insights, and day summaries.",
  "",
  "AI Assistant — Ask anything about my own data. It knows everything.",
  "",
  "Dashboard — One screen that aggregates everything.",
  SEP,
  "## The stack",
  "",
  "Built it the way I think software should be built — simple, fast, maintainable:",
  "",
  "Frontend: Next.js 14 App Router + React 18 + Tailwind CSS",
  "Backend: Node.js + Express.js",
  "Database: MongoDB Atlas via Mongoose",
  "Auth: JWT — stateless, clean, works everywhere",
  "AI: Groq API running Llama 3.3 — free, fast, powerful",
  "Package manager: npm only.",
  "",
  "No Docker. No Redis. No microservices. No unnecessary infrastructure.",
  SEP,
  "## How it feels",
  "",
  "Honestly? It feels like a superpower.",
  "",
  "I opened the dashboard this evening and saw my tasks, my habits, my projects — all in one dark, clean interface that I built. Every pixel is mine. Every feature is exactly what I needed, nothing I didn't.",
  "",
  "The AI can now answer questions about my own life. I asked it what my pending tasks are and it listed them perfectly. I asked how much I spent this month and it knew. That moment — when your personal data becomes conversational — is something else.",
  SEP,
  "## What's next",
  "",
  "This is v1. The foundation is solid. What I want to build on top of it:",
  "",
  "- Mobile app (React Native)",
  "- Smart notifications and follow-up reminders",
  "- Weekly AI review reports",
  "- Data export and backup",
  "- Goal setting and milestone tracking",
  "- Time tracking integration",
  "- Public portfolio mode",
  SEP,
  "## A note to future me",
  "",
  "If you're reading this — you built this in a day. From nothing to a full personal operating system. That's not nothing.",
  "",
  "Keep building. Keep shipping. The best version of SahilOS is the one you haven't built yet.",
  "",
  "Day One. March 13, 2026.",
  "",
  "— Sahil",
].join("\n");

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port:     5000,
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
        reject(new Error("Cannot connect to localhost:5000 — is the backend running?\nOpen a separate terminal in the backend folder and run: npm run dev"));
      } else {
        reject(err);
      }
    });

    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("\n🚀 SahilOS Founding Day Fix");
  console.log("============================\n");

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

  // Step 1: Delete the wrong 2025 entry if it exists
  console.log("🗑️  Checking for wrong 2025-03-13 entry...");
  const oldRes = await request("GET", "/api/journal/date/2025-03-13", null, token);
  if (oldRes.body?.data?._id) {
    const delRes = await request("DELETE", "/api/journal/" + oldRes.body.data._id, null, token);
    if (delRes.status === 200) {
      console.log("✅ Deleted wrong 2025-03-13 entry\n");
    }
  } else {
    console.log("ℹ️  No 2025-03-13 entry found (already clean)\n");
  }

  // Step 2: Write the correct 2026-03-13 entry
  console.log("📖 Writing founding day entry for 2026-03-13...");
  const entryRes = await request("POST", "/api/journal", {
    date:    "2026-03-13",
    mood:    "great",
    tags:    ["milestone", "sahilos", "day-one", "building", "founder"],
    content: CONTENT,
  }, token);

  if (entryRes.status === 200 || entryRes.status === 201) {
    console.log("✅ Entry " + (entryRes.status === 201 ? "created" : "updated") + " on 2026-03-13!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 SahilOS founding day is now correctly on March 13, 2026.");
    console.log("📅 Date  : 2026-03-13");
    console.log("😊 Mood  : great (🚀)");
    console.log("🏷️  Tags  : milestone, sahilos, day-one, building, founder");
    console.log("📝 Words : ~" + CONTENT.split(/\s+/).length);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n→ Open your journal — March 13, 2026 has a 🚀 dot.");
    console.log("→ Click 'Day One — Mar 13, 2026' shortcut in the left panel.\n");
  } else {
    console.error("❌ Failed:", entryRes.body?.message || JSON.stringify(entryRes.body));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});