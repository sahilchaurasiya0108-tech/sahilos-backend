/**
 * istDate.js — frontend IST (UTC+5:30) date helpers
 *
 * date-fns format() uses the JS engine's local timezone, which is correct
 * in the browser. But during Next.js SSR the server runs in UTC, so
 * format(new Date(utcTimestamp), "h:mm a") renders the UTC time, not IST.
 *
 * These helpers explicitly shift timestamps to IST before formatting,
 * so they produce correct IST output regardless of where the code runs.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30

/**
 * Returns a Date object shifted to IST.
 * Use for formatting — the numeric values (hours, minutes, date) will be IST.
 */
export const toIST = (date) =>
  new Date(new Date(date).getTime() + IST_OFFSET_MS);

/**
 * Returns "YYYY-MM-DD" in IST for grouping by calendar day.
 * e.g. 11:40 PM IST April 8 → "2026-04-08" (not April 9 UTC)
 */
export const toISTDateStr = (date) =>
  toIST(date).toISOString().slice(0, 10);

/**
 * Format a UTC timestamp as a time string in IST.
 * Returns e.g. "11:40 PM"
 */
export const formatTimeIST = (date) => {
  const d = toIST(date);
  // Use UTC methods on the shifted date — they now reflect IST values
  let hours   = d.getUTCHours();
  const mins  = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm  = hours >= 12 ? "PM" : "AM";
  hours       = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/**
 * Format a "YYYY-MM-DD" date string as a readable label.
 * e.g. "Wednesday, April 9"
 */
export const formatDayLabelIST = (dateStr) => {
  // Parse as IST midnight to get the correct weekday
  const d = new Date(dateStr + "T00:00:00+05:30");
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
