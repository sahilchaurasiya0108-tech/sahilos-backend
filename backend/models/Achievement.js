const mongoose = require("mongoose");

const ACHIEVEMENT_DEFINITIONS = [
  // ── Onboarding ─────────────────────────────────────────────────────────────
  { key: "first_login",       title: "Welcome Aboard",       description: "Take your first step into SahilOS",           icon: "👋", rarity: "common",    conditionType: "knowledge_count",  conditionValue: 1 },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  { key: "tasks_1",           title: "First Blood",           description: "Complete your very first task",               icon: "✅", rarity: "common",    conditionType: "tasks_completed",  conditionValue: 1 },
  { key: "tasks_10",          title: "Task Slayer",           description: "Complete 10 tasks",                           icon: "⚡", rarity: "common",    conditionType: "tasks_completed",  conditionValue: 10 },
  { key: "tasks_25",          title: "On a Roll",             description: "Complete 25 tasks",                           icon: "🎯", rarity: "uncommon",  conditionType: "tasks_completed",  conditionValue: 25 },
  { key: "tasks_50",          title: "Task Machine",          description: "Complete 50 tasks — you're unstoppable",      icon: "🔥", rarity: "uncommon",  conditionType: "tasks_completed",  conditionValue: 50 },
  { key: "tasks_100",         title: "Centurion",             description: "100 tasks completed. Absolute unit.",         icon: "🏆", rarity: "rare",      conditionType: "tasks_completed",  conditionValue: 100 },
  { key: "tasks_250",         title: "Task Legend",           description: "250 tasks. Your to-do list fears you.",       icon: "💎", rarity: "epic",      conditionType: "tasks_completed",  conditionValue: 250 },
  { key: "tasks_500",         title: "Productivity God",      description: "500 tasks. You don't stop.",                  icon: "👑", rarity: "legendary", conditionType: "tasks_completed",  conditionValue: 500 },

  // ── Habits ─────────────────────────────────────────────────────────────────
  { key: "habit_streak_3",    title: "Getting Started",       description: "3-day habit streak — the hardest part",       icon: "🌱", rarity: "common",    conditionType: "habit_streak",     conditionValue: 3 },
  { key: "habit_streak_7",    title: "Week Warrior",          description: "7 days straight. One full week.",             icon: "🔥", rarity: "common",    conditionType: "habit_streak",     conditionValue: 7 },
  { key: "habit_streak_14",   title: "Two-Week Titan",        description: "14 days. You're building something real.",    icon: "💪", rarity: "uncommon",  conditionType: "habit_streak",     conditionValue: 14 },
  { key: "habit_streak_21",   title: "Habit Formed",          description: "21 days — science says it's a habit now",    icon: "🧠", rarity: "uncommon",  conditionType: "habit_streak",     conditionValue: 21 },
  { key: "habit_streak_30",   title: "Monthly Master",        description: "30 days. A full month of discipline.",        icon: "🌟", rarity: "rare",      conditionType: "habit_streak",     conditionValue: 30 },
  { key: "habit_streak_60",   title: "Iron Will",             description: "60 days. Most people quit at day 3.",         icon: "⚙️", rarity: "epic",      conditionType: "habit_streak",     conditionValue: 60 },
  { key: "habit_streak_100",  title: "Century Club",          description: "100 days straight. You are the habit.",       icon: "💎", rarity: "legendary", conditionType: "habit_streak",     conditionValue: 100 },
  { key: "habit_streak_365",  title: "Year of Mastery",       description: "365 days. An entire year. Legendary.",        icon: "🌌", rarity: "mythic",    conditionType: "habit_streak",     conditionValue: 365 },

  // ── Projects ───────────────────────────────────────────────────────────────
  { key: "projects_1",        title: "First Ship",            description: "Complete your first project",                 icon: "🚀", rarity: "common",    conditionType: "projects_done",    conditionValue: 1 },
  { key: "projects_3",        title: "Builder",               description: "3 projects shipped. Pattern emerging.",       icon: "🏗️", rarity: "uncommon",  conditionType: "projects_done",    conditionValue: 3 },
  { key: "projects_5",        title: "Serial Builder",        description: "5 projects done. You ship things.",           icon: "⚙️", rarity: "rare",      conditionType: "projects_done",    conditionValue: 5 },
  { key: "projects_10",       title: "Prolific Creator",      description: "10 projects. Portfolio incoming.",            icon: "🎯", rarity: "epic",      conditionType: "projects_done",    conditionValue: 10 },
  { key: "projects_20",       title: "Studio Boss",           description: "20 projects. You're basically a studio.",     icon: "🏛️", rarity: "legendary", conditionType: "projects_done",    conditionValue: 20 },

  // ── Learning ───────────────────────────────────────────────────────────────
  { key: "learning_1",        title: "First Lesson",          description: "Complete your first learning item",           icon: "📖", rarity: "common",    conditionType: "learning_done",    conditionValue: 1 },
  { key: "learning_5",        title: "Curious Mind",          description: "5 learning items completed",                  icon: "📚", rarity: "common",    conditionType: "learning_done",    conditionValue: 5 },
  { key: "learning_10",       title: "Scholar",               description: "10 items done. Your brain thanks you.",       icon: "🎓", rarity: "uncommon",  conditionType: "learning_done",    conditionValue: 10 },
  { key: "learning_20",       title: "Knowledge Seeker",      description: "20 items. You're obsessed with growth.",      icon: "🧠", rarity: "rare",      conditionType: "learning_done",    conditionValue: 20 },
  { key: "learning_50",       title: "Autodidact",            description: "50 things learned. University who?",          icon: "🔬", rarity: "epic",      conditionType: "learning_done",    conditionValue: 50 },
  { key: "learning_100",      title: "Renaissance Person",    description: "100 items. You know too much.",               icon: "🌌", rarity: "legendary", conditionType: "learning_done",    conditionValue: 100 },

  // ── Journal ────────────────────────────────────────────────────────────────
  { key: "journal_1",         title: "First Entry",           description: "Write your first journal entry",              icon: "✏️", rarity: "common",    conditionType: "journal_entries",  conditionValue: 1 },
  { key: "journal_7",         title: "Week of Reflection",    description: "7 journal entries written",                   icon: "📓", rarity: "common",    conditionType: "journal_entries",  conditionValue: 7 },
  { key: "journal_30",        title: "Month of Clarity",      description: "30 journal entries. You know yourself.",      icon: "📖", rarity: "rare",      conditionType: "journal_entries",  conditionValue: 30 },
  { key: "journal_100",       title: "Life Chronicler",       description: "100 entries. Your future self will thank you",icon: "📜", rarity: "epic",      conditionType: "journal_entries",  conditionValue: 100 },
  { key: "journal_365",       title: "The Diarist",           description: "365 entries. A whole year documented.",       icon: "🌌", rarity: "mythic",    conditionType: "journal_entries",  conditionValue: 365 },

  // ── Knowledge ──────────────────────────────────────────────────────────────
  { key: "knowledge_1",       title: "First Note",            description: "Add your first knowledge entry",              icon: "💡", rarity: "common",    conditionType: "knowledge_count",  conditionValue: 1 },
  { key: "knowledge_10",      title: "Second Brain",          description: "10 knowledge entries — your external memory", icon: "🧩", rarity: "uncommon",  conditionType: "knowledge_count",  conditionValue: 10 },
  { key: "knowledge_25",      title: "Archivist",             description: "25 entries. Your own Wikipedia.",             icon: "🗂️", rarity: "rare",      conditionType: "knowledge_count",  conditionValue: 25 },
  { key: "knowledge_50",      title: "Mind Vault",            description: "50 entries. The vault is filling up.",        icon: "🏛️", rarity: "epic",      conditionType: "knowledge_count",  conditionValue: 50 },
  { key: "knowledge_100",     title: "Omniscient",            description: "100 knowledge entries. Legend.",              icon: "🌌", rarity: "legendary", conditionType: "knowledge_count",  conditionValue: 100 },

  // ── Budget ─────────────────────────────────────────────────────────────────
  { key: "budget_first",      title: "Money Aware",           description: "Log your first budget entry",                 icon: "💰", rarity: "common",    conditionType: "budget_count",     conditionValue: 1 },
  { key: "budget_10",         title: "Penny Tracker",         description: "10 budget entries. Watching every rupee.",    icon: "📊", rarity: "uncommon",  conditionType: "budget_count",     conditionValue: 10 },
  { key: "budget_50",         title: "Finance Pro",           description: "50 budget entries. Your wallet obeys you.",   icon: "💹", rarity: "rare",      conditionType: "budget_count",     conditionValue: 50 },
  { key: "budget_100",        title: "CFO Mode",              description: "100 entries. You are the CFO of your life.",  icon: "🏦", rarity: "epic",      conditionType: "budget_count",     conditionValue: 100 },

  // ── Ideas ──────────────────────────────────────────────────────────────────
  { key: "ideas_1",           title: "First Spark",           description: "Log your first idea — every empire starts here", icon: "💡", rarity: "common",  conditionType: "ideas_count",      conditionValue: 1 },
  { key: "ideas_10",          title: "Idea Machine",          description: "10 ideas in the vault",                       icon: "⚡", rarity: "uncommon",  conditionType: "ideas_count",      conditionValue: 10 },
  { key: "ideas_25",          title: "Creative Force",        description: "25 ideas. Your mind never stops.",             icon: "🎨", rarity: "rare",      conditionType: "ideas_count",      conditionValue: 25 },
  { key: "ideas_50",          title: "Visionary",             description: "50 ideas. You're ahead of everyone.",         icon: "🔭", rarity: "epic",      conditionType: "ideas_count",      conditionValue: 50 },
];

const achievementSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key:            { type: String, required: true },
    title:          { type: String, required: true },
    description:    { type: String, required: true },
    icon:           { type: String, default: "🏅" },
    rarity:         { type: String, enum: ["common", "uncommon", "rare", "epic", "legendary", "mythic"], default: "common" },
    conditionType:  { type: String, required: true },
    conditionValue: { type: Number, required: true },
    unlocked:       { type: Boolean, default: false },
    unlockedAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });
achievementSchema.index({ userId: 1, unlocked: 1 });

module.exports = mongoose.model("Achievement", achievementSchema);
module.exports.ACHIEVEMENT_DEFINITIONS = ACHIEVEMENT_DEFINITIONS;
