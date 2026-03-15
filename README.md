# SahilOS — Personal Life & Career Operating System

A premium, full-stack personal dashboard that combines productivity, career management, learning, and personal growth into one intelligent system. Built with Next.js, Express, and MongoDB.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router), React 18   |
| Styling     | Tailwind CSS 3                      |
| Backend     | Node.js, Express.js                 |
| Database    | MongoDB via Mongoose 8              |
| Auth        | JWT (jsonwebtoken + bcryptjs)       |
| HTTP Client | Axios                               |
| Package Mgr | npm only                            |

---

## Project Structure

```
sahilos/
├── package.json          ← Root scripts (install:all, dev)
├── backend/
│   ├── server.js
│   ├── .env
│   ├── config/db.js
│   ├── middleware/        auth.js | asyncHandler.js | errorHandler.js
│   ├── models/            User Task Project Habit HabitLog Idea
│   │                      JobApplication LearningItem JournalEntry Activity
│   ├── controllers/       one per module
│   ├── routes/            one per module
│   └── utils/             activityLogger | pagination | streakCalculator
└── frontend/
    ├── app/
    │   ├── (auth)/        login | register
    │   └── (app)/         dashboard | tasks | projects | habits
    │                      ideas | jobs | learning | journal | activity
    ├── components/
    │   ├── layout/        Sidebar | Topbar | PageWrapper
    │   ├── dashboard/     widgets.jsx (all 7 widgets)
    │   ├── tasks/         TaskComponents.jsx
    │   └── ui/            index.jsx | Modal.jsx
    ├── hooks/             useDashboard | useTasks | useProjects (+ useHabits, useJobs)
    │                      useIdeas (+ useLearning, useJournal)
    ├── context/           AuthContext.jsx
    └── lib/               api.js | constants.js
```

---

## Quick Start

### 1 — Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally on `mongodb://localhost:27017`
  - Install: https://www.mongodb.com/docs/manual/installation/
  - Or use a free **MongoDB Atlas** cluster (cloud) — update `MONGO_URI` in `.env`

### 2 — Install Dependencies

```bash
# From the project root
npm run install:all
```

This runs `npm install` in both `backend/` and `frontend/` automatically.

### 3 — Configure Environment

The backend `.env` file is pre-configured for local development:

```
# backend/.env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/sahilos
JWT_SECRET=sahilos_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

**For production**, change `JWT_SECRET` to a strong random string and update `MONGO_URI` to your Atlas URI.

### 4 — Run Development Servers

**Option A — Two terminals (recommended):**

```bash
# Terminal 1 — Backend API (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

**Option B — Root shortcut (Unix/Mac):**

```bash
npm run dev
```

### 5 — Open the App

Navigate to **http://localhost:3000**

Register a new account and you're in.

---

## Core Modules

### 1. Command Center Dashboard
- Personalized greeting by time of day
- Today's focus tasks (high/urgent priority)
- Habit streaks with today's completion status
- Active project progress bars
- Job pipeline stage counts
- Learning in-progress items
- Last 10 activity events
- **30-second server-side cache** per user to prevent repeated DB aggregations

### 2. Task System
- List view and Kanban board (toggle)
- Priority: low / medium / high / urgent
- Status: todo / in-progress / review / done
- Subtasks with individual toggle
- Due dates, tags, project linking
- Quick-add input bar
- Filters by status and priority

### 3. Project OS
- Progress calculated automatically from milestone completion
- Milestone checklist with live toggle
- Repo link, status, colour coding
- Linked task stats (aggregated by status)

### 4. Habit Intelligence
- Daily check-in (idempotent — safe to re-tap)
- Current streak and longest streak auto-calculated
- Weekly success rate utility
- 90-day heatmap data endpoint
- Today's completion rate progress bar

### 5. Idea Vault
- Star ratings (1–5)
- Status: raw / refined / converted
- **"Convert to Project"** — one-click creates a new Project from an Idea
- Tags filtering

### 6. Job Application CRM
- Kanban pipeline: Saved → Applied → Interview → Offer → Rejected
- Company, role, salary, job URL, contact person
- Applied date and follow-up date tracking
- Stage changes logged to Activity Timeline

### 7. Learning Tracker
- Categories: skill / course / book / other
- Progress slider (0–100%) with status auto-sync
- Resource links per item
- Filter by status

### 8. Daily Journal
- Date navigator (backward through history)
- Mood selector: great / good / neutral / bad / awful
- **Autosave** — 2 seconds after you stop typing
- Per-date upsert (edit existing or create new seamlessly)
- Recent entries list

### 9. Activity Timeline
- Every create/update/complete action is logged
- Paginated feed (20 per page) with "Load More"
- Grouped by date with timeline connector
- Shows stage transitions, streak milestones, mood

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

All list endpoints support:
```
?page=1&limit=20
```

### Auth
```
POST   /api/auth/register        { name, email, password }
POST   /api/auth/login           { email, password }
GET    /api/auth/me              → current user
PATCH  /api/auth/me              { name, avatar, timezone }
PATCH  /api/auth/change-password { currentPassword, newPassword }
```

### Dashboard
```
GET    /api/dashboard            → aggregated summary (30s cached)
```

### Tasks
```
GET    /api/tasks                ?page ?limit ?status ?priority ?projectId ?tag ?search
POST   /api/tasks                { title, description, priority, status, dueDate, tags, projectId, subtasks }
GET    /api/tasks/:id
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/status     { status }
PATCH  /api/tasks/:id/subtasks/:subtaskId   (toggles done)
DELETE /api/tasks/:id            (soft delete)
```

### Projects
```
GET    /api/projects             ?page ?limit ?status ?search
POST   /api/projects             { title, description, status, repoLink, milestones, notes, color }
GET    /api/projects/:id         → includes taskStats
PUT    /api/projects/:id
PATCH  /api/projects/:id/milestones/:milestoneId  (toggles done, recalcs progress)
DELETE /api/projects/:id         (soft delete)
```

### Habits
```
GET    /api/habits               → includes completedToday flag
POST   /api/habits               { title, description, frequency, color, icon }
PUT    /api/habits/:id
DELETE /api/habits/:id           (soft delete)
POST   /api/habits/:id/log       → logs today, recalcs streak (idempotent)
DELETE /api/habits/:id/log       → removes today's log
GET    /api/habits/:id/stats     → streak + weekly rate + heatmap (90 days)
```

### Ideas
```
GET    /api/ideas                ?page ?limit ?status ?tag ?search
POST   /api/ideas                { title, description, tags, rating }
GET    /api/ideas/:id
PUT    /api/ideas/:id
POST   /api/ideas/:id/convert    → creates Project, marks idea as converted
DELETE /api/ideas/:id
```

### Jobs
```
GET    /api/jobs                 ?page ?limit ?stage ?search
POST   /api/jobs                 { company, role, stage, notes, contactPerson, salary, jobUrl, followUpDate, appliedDate }
GET    /api/jobs/:id
PUT    /api/jobs/:id
PATCH  /api/jobs/:id/stage       { stage }
DELETE /api/jobs/:id
```

### Learning
```
GET    /api/learning             ?page ?limit ?status ?category ?search
POST   /api/learning             { title, category, progress, resources, notes, tags }
GET    /api/learning/:id
PUT    /api/learning/:id
PATCH  /api/learning/:id/progress  { progress }   (auto-syncs status)
DELETE /api/learning/:id
```

### Journal
```
GET    /api/journal              ?page ?limit ?mood ?search
POST   /api/journal              { date, content, mood, tags }   (upsert by date)
GET    /api/journal/date/:date   → YYYY-MM-DD  (returns empty shell if no entry)
DELETE /api/journal/:id
```

### Activity
```
GET    /api/activity             ?page ?limit ?type
```

---

## Architecture Decisions

### Soft Deletes
All main models have `isDeleted: false`. `DELETE` endpoints flip this flag — data is never destroyed. Useful for future trash/restore UI and analytics.

### Activity Types (Enum)
`Activity.type` is a strict Mongoose enum enforcing only 10 allowed values, preventing typos across the codebase.

### Dashboard Cache
`dashboardController.js` uses a `Map`-based in-memory cache keyed by `userId`. TTL is 30 seconds. No Redis required — the cache lives in the Node.js process and resets on restart, which is fine for local/single-instance use.

### Pagination Utility
`utils/pagination.js` is a shared helper used by every list controller. Response envelope:
```json
{
  "success": true,
  "pagination": { "total": 42, "page": 1, "limit": 20, "pages": 3, "hasNext": true, "hasPrev": false },
  "data": [...]
}
```

### Streak Calculation
Pure functions in `utils/streakCalculator.js` — no DB queries, just date array math. Streaks are denormalised onto the `Habit` document after each log for fast dashboard reads.

---

## Future SaaS Upgrade Path

The architecture is designed to scale into a multi-tenant SaaS with minimal changes:

| Feature         | Change Required                                    |
|-----------------|----------------------------------------------------|
| Auth            | Swap localStorage → httpOnly cookie, add refresh token rotation |
| OAuth           | Drop in `passport-google-oauth20`                  |
| Payments        | Add `stripe` package + `user.plan` field           |
| Multi-tenancy   | All queries already scoped by `userId`             |
| Cache           | Swap Map → Redis (`ioredis`) — same API shape      |
| Rate limiting   | Add `express-rate-limit` middleware                |
| File uploads    | Add `multer` + S3 for avatars                      |
| Email           | Add `nodemailer` for follow-up reminders           |

---

## License

MIT — build anything you want on top of this.
