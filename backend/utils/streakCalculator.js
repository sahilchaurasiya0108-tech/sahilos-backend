/**
 * streakCalculator
 * Pure utility functions for habit streak logic.
 * Works with arrays of Date objects (completedDate from HabitLog).
 */

/**
 * normaliseDate
 * Strips time component — returns midnight UTC string for comparison.
 */
const normaliseDate = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
};

/**
 * calculateCurrentStreak
 * Counts consecutive days ending today (or yesterday).
 *
 * @param {Date[]} completedDates - Array of completedDate values from HabitLog
 * @returns {number} current streak length
 */
const calculateCurrentStreak = (completedDates) => {
  if (!completedDates.length) return 0;

  // Unique sorted dates descending
  const unique = [
    ...new Set(completedDates.map(normaliseDate)),
  ].sort((a, b) => (a > b ? -1 : 1));

  const todayStr = normaliseDate(new Date());
  const yesterdayStr = normaliseDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  // Streak must include today or yesterday to be active
  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

/**
 * calculateLongestStreak
 * Scans all historical dates to find the longest ever streak.
 *
 * @param {Date[]} completedDates
 * @returns {number} longest streak length
 */
const calculateLongestStreak = (completedDates) => {
  if (!completedDates.length) return 0;

  const unique = [
    ...new Set(completedDates.map(normaliseDate)),
  ].sort((a, b) => (a > b ? 1 : -1)); // ascending

  let longest = 1;
  let current = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
};

/**
 * calculateWeeklySuccessRate
 * Percentage of last 7 days the habit was completed.
 *
 * @param {Date[]} completedDates
 * @returns {number} 0–100
 */
const calculateWeeklySuccessRate = (completedDates) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUnique = new Set(
    completedDates
      .filter((d) => new Date(d) >= sevenDaysAgo)
      .map(normaliseDate)
  );
  return Math.round((recentUnique.size / 7) * 100);
};

module.exports = {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateWeeklySuccessRate,
  normaliseDate,
};
