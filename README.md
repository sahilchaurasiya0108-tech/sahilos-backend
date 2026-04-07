# SahilOS — Personal Life & Career Operating System

> A full-stack personal productivity and life management app built with **Next.js 14** (frontend) and **Express + MongoDB** (backend). Think of it as a second brain, career tracker, habit coach, and budget manager all rolled into one private dashboard.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Features](#features)
  - [Dashboard](#1-dashboard)
  - [Tasks](#2-tasks)
  - [Projects](#3-projects)
  - [Habits](#4-habits)
  - [Journal](#5-journal)
  - [Learning Tracker](#6-learning-tracker)
  - [Budget Tracker](#7-budget-tracker)
  - [Job Application Tracker](#8-job-application-tracker)
  - [Idea Vault](#9-idea-vault)
  - [Knowledge Base](#10-knowledge-base)
  - [Life Vision Board](#11-life-vision-board)
  - [Life Heatmap](#12-life-heatmap)
  - [AI Assistant](#13-ai-assistant)
  - [Achievements](#14-achievements)
  - [Notifications](#15-notifications)
  - [Activity Feed](#16-activity-feed)
  - [Authentication](#17-authentication)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | Next.js 14 (App Router), React 18, Tailwind CSS  |
| Backend   | Node.js, Express 4                               |
| Database  | MongoDB via Mongoose 8                           |
| AI        | Groq API (`llama-3.3-70b-versatile`)             |
| Auth      | JWT + bcryptjs                                   |
| Push      | Web Push (VAPID)                                 |
| Cron      | node-cron (scheduled notifications)              |
| UI Extras | lucide-react, react-hot-toast, date-fns, clsx    |

---

## Getting Started

```bash
# 1. Install all dependencies (root, backend, frontend)
npm run install:all

# 2. Set up environment variables (see below)
cp backend/.env.example backend/.env

# 3. Run both servers concurrently
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:3000`.

---

## Features

### 1. Dashboard

The central command center that aggregates data from every module into a single at-a-glance view.

- **Focus Tasks** — shows your top high/urgent priority tasks not yet done, sorted by due date
- **Active Projects** — lists your in-progress projects with progress bars
- **Habit Ring** — shows all active habits with today's completion status and current streaks
- **Job Pipeline** — a count breakdown by stage (saved / applied / interview / offer / rejected)
- **Learning in Progress** — highlights learning items currently in progress
- **Budget Snapshot** — shows this month's income, expense, and balance
- **Recent Activity** — last 10 events across all modules
- **Daily Quote** — an AI-generated (or curated fallback) motivational quote personalised by time of day and name
- **30-second in-memory cache** — the dashboard is cached per user to prevent repeated DB hits on rapid refreshes

---

### 2. Tasks

A full task management system with Kanban-style status flow and subtask support.

- Create tasks with title, description, priority (`low` / `medium` / `high` / `urgent`), status, due date, tags, and optional project link
- **Four statuses**: `todo` → `in-progress` → `review` → `done`
- **Subtasks** — each task can contain multiple subtasks; toggle individual subtasks as done/undone
- **Patch status endpoint** — designed for Kanban drag-and-drop (`PATCH /tasks/:id/status`)
- Filter tasks by status, priority, project, tag, or keyword search
- Paginated results
- Completing a task triggers achievement evaluation
- Soft delete (tasks are never hard-deleted)

---

### 3. Projects

Manage personal or professional projects from idea to launch.

- Create projects with title, description, status (`planning` / `active` / `on-hold` / `completed` / `cancelled`), repo link, live URL, notes, color label, and categories
- **Milestones** — add milestones to each project; toggle individual milestones done/undone
- **Auto-progress calculation** — project progress percentage is recalculated automatically based on completed milestones whenever milestones are updated
- **Task stats** — each project detail view includes a breakdown of linked tasks by status
- Filter by status, category, or search by name
- Soft delete

---

### 4. Habits

Build and maintain daily or weekly habits with full streak tracking.

- Create habits with title, description, frequency (`daily` / `weekly`), custom color, and emoji icon
- **Log completion** — mark a habit done for today (idempotent — safe to call multiple times)
- **Un-log** — remove today's completion if logged by mistake
- **Streak tracking** — current streak and longest streak are recalculated and persisted after every log/un-log using a dedicated streak calculator utility
- **Timezone-aware logging** — the API accepts a `localDate` parameter from the client to handle timezone gaps (e.g. IST vs UTC)
- **Heatmap data** — per-habit stats endpoint returns the last 90 days of completions in heatmap format
- **Milestone notifications** — push/in-app notifications fire automatically at streak milestones: 7, 14, 21, 30, 60, and 100 days
- **Weekly success rate** — calculated from all log history
- Soft delete (habit logs are preserved)

---

### 5. Journal

A private daily journal with mood tracking, AI reflection, and writing streaks.

- Write journal entries by date (one per day, upserted on save)
- **Mood tracking** — tag each entry with a mood (e.g. neutral, happy, sad, anxious, motivated)
- **Writing streak** — tracks consecutive days with a non-empty journal entry; shown as a streak counter
- **Mood trend** — 7-day mood history endpoint for visualising emotional patterns
- **Day Insights** — for any date, see all tasks completed, habits logged, budget entries, and learning items updated on that day — surfaced alongside the journal entry
- **AI Reflection** — send an entry to the Groq AI and receive a structured reflection including: a 2–3 sentence summary, the emotional tone, one meaningful insight, and a thoughtful question to consider
- Search entries by keyword or filter by mood
- Paginated listing
- Soft delete

---

### 6. Learning Tracker

Track everything you're learning — courses, books, skills, videos, and more.

- Add learning items with title, category, progress (0–100%), status (`not-started` / `in-progress` / `completed`), resources, notes, and tags
- **Progress patch** — dedicated endpoint (`PATCH /learning/:id/progress`) auto-updates status based on the progress value: 0 → `not-started`, 1–99 → `in-progress`, 100 → `completed`
- **Completion notification** — when progress reaches 100%, an in-app notification fires celebrating the completion
- Filter by status or category; keyword search on title
- Paginated, sorted by last updated

---

### 7. Budget Tracker

Personal finance tracking with monthly summaries and category-aware budget warnings.

- Log income and expense entries with title, amount, type, category (food / transport / entertainment / shopping / other), date, and notes
- **Monthly summary** — aggregated income, expense, balance, and a category breakdown of expenses (for charting)
- **Filter by month** — pass `?month=YYYY-MM` to scope any query to a specific month
- **Budget warnings** — after every new expense, the backend checks if total spend in that category has exceeded 80% of a configurable threshold; if so, a push/in-app notification is triggered
- Paginated entry listing with filtering by type, category, and month
- Soft delete

---

### 8. Job Application Tracker

A Kanban-style pipeline for tracking your entire job search.

- Log applications with company, role, stage, notes, contact person, salary range, job URL, applied date, and follow-up date
- **Five stages**: `saved` → `applied` → `interview` → `offer` → `rejected`
- **Patch stage endpoint** — designed for Kanban drag-and-drop (`PATCH /jobs/:id/stage`)
- Stage changes are logged to the activity feed
- Filter by stage or search by company/role name
- Follow-up dates are visible in the AI context so the assistant can remind you
- Soft delete

---

### 9. Idea Vault

A capture system for storing, rating, and acting on your ideas.

- Save ideas with title, description, tags, and a 1–5 star rating
- **Status flow**: `raw` → `in-progress` → `validated` → `converted` → `dropped`
- Ideas are sorted by rating (highest first) then by date
- **Convert to Project** — one-click endpoint (`POST /ideas/:id/convert`) that creates a new Project from the idea, marks the idea as `converted`, and stores a reference to the generated project
- Filter by status or tag; search by title
- Achievement evaluation runs after saving a new idea

---

### 10. Knowledge Base

A personal second-brain for saving anything worth remembering.

- Save entries across 8 categories: `book`, `movie`, `web_series`, `anime`, `quote`, `person`, `article`, `other`
- Fields include title, category, freeform content/notes, tags, author, 1–5 star rating, and status (`want` / `in-progress` / `done`)
- **Count summary** — endpoint returning total entries and a per-category count breakdown (useful for dashboard widgets)
- Full-text search across title, content, and tags
- Filter by category or tag
- Paginated listing sorted by newest first

---

### 11. Life Vision Board

A single-document space to define your personal mission and long-range goals.

- One vision document per user, upserted on save
- **Four sections**:
  - **Mission** — your personal mission statement (up to 2,000 characters)
  - **3-Year Vision** — where you want to be in 3 years (up to 3,000 characters)
  - **1-Year Goals** — concrete goals for the next 12 months (up to 3,000 characters)
  - **Current Focus** — your current sprint-level priority (up to 1,000 characters)
- The life vision is included in the AI assistant's context, so you can ask the AI questions grounded in your stated mission and goals

---

### 12. Life Heatmap

A GitHub-style productivity heatmap showing 6 months of daily activity at a glance.

- Log four daily metrics each day:
  - **Coding minutes**
  - **Reading minutes**
  - **Habits completed**
  - **Focus minutes**
- The heatmap renders 26 weeks (182 days) of history; cells are colour-coded by activity intensity
- **Today pre-fill** — the log form is pre-populated with today's already-saved values when you open the page
- **Summary statistics** — total and per-active-day averages for all four metrics are shown below the heatmap
- The page shows how many total active days exist in the last 6 months

---

### 13. AI Assistant

A context-aware personal AI assistant powered by Groq's `llama-3.3-70b-versatile` model.

- **Fully contextual** — before every query, the backend builds a real-time snapshot of your data from all 10 modules (tasks, projects, habits, learning, journal, jobs, budget, ideas, knowledge, life vision) and injects it into the system prompt
- **Free-form Q&A** — ask anything about your own life data, e.g. "What are my overdue tasks?", "How much did I spend this month?", "Which job applications need follow-up?", "What is my current focus?"
- **Smart suggestions** — the assistant surfaces 6–8 personalised suggested prompts based on what data actually exists for you (no suggestions for empty modules)
- **Daily quote** — a fresh motivational quote generated by AI each day, personalised by your name and time of day, with a 28-quote curated fallback pool if the API is unavailable; cached per user per day to avoid repeat calls
- **Journal AI Reflection** — separate AI endpoint in the journal module that analyses a journal entry and returns structured emotional insight (see Journal section)
- Question length is capped at 500 characters; AI responses are capped at 1,024 tokens

---

### 14. Achievements

A gamification layer that rewards you for real milestones across all modules.

- **50 built-in achievement definitions** across 8 categories: Tasks, Habits, Projects, Learning, Journal, Knowledge, Budget, and Ideas
- **Six rarity tiers**: Common → Uncommon → Rare → Epic → Legendary → Mythic
- Achievements are seeded automatically on first load — no manual setup needed
- **Automatic evaluation** — `evaluateAchievements()` is called asynchronously every time you complete a task, finish a habit, save an idea, write a journal entry, add knowledge, or save a budget entry
- On unlock, an in-app notification fires and the event is logged to the activity feed
- The achievements page sorts unlocked achievements first, then by target value ascending
- Example milestones: completing 1 / 10 / 25 / 50 / 100 / 250 / 500 tasks; habit streaks of 3 / 7 / 14 / 21 / 30 / 60 / 100 / 365 days; 1 / 3 / 5 / 10 / 20 completed projects; and many more

---

### 15. Notifications

A full in-app and web push notification system with scheduled cron jobs.

**In-app notifications:**
- Stored in MongoDB per user with type (`info` / `warning` / `success` / `error`), category, action link, and metadata
- Mark individual notifications as read, or mark all as read at once
- Delete individual notifications or clear all (optionally filtered by type)
- Unread count endpoint for the notification bell badge
- Duplicate overdue notifications are deduplicated via a cleanup endpoint

**Web Push (PWA):**
- VAPID-based browser push notifications
- Subscribe/unsubscribe endpoints; subscriptions stored in the database
- Push notifications are sent for habit milestone achievements, budget warnings, achievement unlocks, and task/habit reminders

**Scheduled cron jobs (node-cron):**
- **Every hour** — check for tasks due within 24 hours; send one "due soon" notification per task per 12-hour window
- **Daily 9 AM** — check for overdue tasks; send one overdue notification per task ever (not repeated)
- **Daily 8 PM** — check habit streaks in danger (not yet completed today); send streak-at-risk warning
- **Daily 9 AM** — send a time-aware fun/motivational notification to all users
- **Daily 6 PM** — inactivity check; notify users who haven't been active in 24+ hours
- **Daily 9 PM** — evening journal reminder to all users
- **Sunday 8 AM** — weekly productivity summary notification to all users

---

### 16. Activity Feed

A chronological log of everything you do across all modules.

- Every significant action is logged: task created/completed, project created/updated, habit completed, journal written, knowledge added, idea saved, job stage changed, achievement unlocked, vision updated, daily stats logged, and more
- Accessible via `GET /api/activity` with optional type filter
- Paginated, newest first
- Shown in the dashboard's "Recent Activity" widget (last 10 events)
- User's `lastActiveAt` timestamp is updated on every authenticated API call via middleware

---

### 17. Authentication

- Register with name, email, and password (minimum 6 characters)
- JWT-based authentication; tokens are sent in the `Authorization: Bearer` header
- Passwords are hashed with bcryptjs (12 rounds)
- Protected routes use an `auth` middleware that verifies the JWT and attaches `req.user`
- User profile includes name, email, optional avatar URL, timezone, and role (user/admin, reserved for future use)
- Public JSON profile method strips the password from all responses

---

## Environment Variables

Create `backend/.env` with the following:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000

# AI (optional — daily quote and AI assistant)
GROQ_API_KEY=your_groq_api_key

# Web Push (optional — browser push notifications)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:you@example.com

# Render.com (optional — keep-alive ping for free tier)
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

---

## Project Structure

```
sahilos/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Route handlers (one per module)
│   ├── middleware/     # auth, asyncHandler, errorHandler, trackActivity
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── utils/
│   │   ├── achievementEngine.js   # Seed + evaluate achievements
│   │   ├── activityLogger.js      # Log events to Activity collection
│   │   ├── notificationCron.js    # Scheduled notification jobs
│   │   ├── notificationGenerator.js # Fun/motivational message pool
│   │   ├── notificationService.js # Create + send push notifications
│   │   ├── pagination.js          # Reusable pagination helper
│   │   └── streakCalculator.js    # Current/longest streak + weekly rate
│   └── server.js
│
└── frontend/
    ├── app/
    │   ├── (app)/       # Protected app pages (dashboard, tasks, habits, etc.)
    │   └── (auth)/      # Login and register pages
    ├── components/
    │   ├── achievements/
    │   ├── dashboard/
    │   ├── heatmap/
    │   ├── layout/      # Sidebar, Topbar, PageWrapper
    │   ├── notifications/
    │   ├── tasks/
    │   └── ui/          # Modal, Button, Spinner, etc.
    ├── context/         # AuthContext, NotificationContext
    ├── hooks/           # Per-module data hooks (useTasks, useHabits, etc.)
    ├── lib/
    │   ├── api.js        # Axios instance with auth interceptor
    │   └── constants.js
    └── public/
        └── sw.js         # Service worker for PWA push notifications
```