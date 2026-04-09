/**
 * istUtils.js
 * IST (UTC+5:30) date helpers for all server-side date logic.
 *
 * The server runs in UTC. MongoDB stores timestamps in UTC.
 * Indian users are UTC+5:30, so "today" on the server (UTC) can be
 * a different calendar date than "today" for the user (IST).
 *
 * These helpers shift timestamps to IST before extracting date strings,
 * ensuring streak windows, journal lookups, and cron checks all use
 * the correct IST calendar date.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 in milliseconds

/**
 * Returns the current date string in IST as "YYYY-MM-DD".
 * Use this wherever you previously did: new Date().toISOString().slice(0, 10)
 */
const todayIST = () => {
  const nowInIST = new Date(Date.now() + IST_OFFSET_MS);
  return nowInIST.toISOString().slice(0, 10);
};

/**
 * Converts any Date (or date-like value) to its "YYYY-MM-DD" string in IST.
 * Use this wherever you need to know what calendar date a UTC timestamp
 * falls on for an IST user.
 *
 * @param {Date|string|number} date
 * @returns {string} "YYYY-MM-DD" in IST
 */
const toISTDateStr = (date) => {
  const shifted = new Date(new Date(date).getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
};

/**
 * Returns a Date object representing midnight IST for a given "YYYY-MM-DD" string.
 * Stored in MongoDB as a UTC Date (midnight IST = 18:30 UTC previous day).
 *
 * @param {string} dateStr "YYYY-MM-DD" in IST
 * @returns {Date} UTC Date representing midnight IST of that date
 */
const midnightISTtoUTC = (dateStr) => {
  // Midnight IST = T00:00:00+05:30 = T18:30:00Z of the PREVIOUS UTC day
  return new Date(dateStr + "T00:00:00+05:30");
};

module.exports = { todayIST, toISTDateStr, midnightISTtoUTC, IST_OFFSET_MS };
