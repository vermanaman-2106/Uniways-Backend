// Time utility helpers used across controllers.
// All times are interpreted in the local server timezone.

/**
 * Return true if time ranges overlap.
 * Uses a half-open interval model: [start, end)
 */
export function isTimeOverlapping(start1, end1, start2, end2) {
  // Guard against invalid ranges.
  if (start1 == null || end1 == null || start2 == null || end2 == null) return false;
  return start1 < end2 && start2 < end1;
}

/**
 * Parse an "HH:MM" string into minutes since midnight.
 * Accepts "H:MM" and "HH:MM" forms.
 */
export function parseHHMMToMinutes(timeStr) {
  if (typeof timeStr !== 'string') {
    throw new Error('Invalid time format');
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error('Invalid time format');

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) throw new Error('Invalid time format');
  if (hours < 0 || hours > 23) throw new Error('Invalid time hours');
  if (minutes < 0 || minutes > 59) throw new Error('Invalid time minutes');

  return hours * 60 + minutes;
}

/**
 * Parse an "HH" (hour) string into minutes since midnight.
 * Accepts "H" and "HH" forms.
 */
export function parseHourToMinutes(hourStr) {
  if (typeof hourStr !== 'string') {
    throw new Error('Invalid hour format');
  }

  const match = hourStr.trim().match(/^(\d{1,2})$/);
  if (!match) throw new Error('Invalid hour format');

  const hours = Number(match[1]);
  if (!Number.isInteger(hours)) throw new Error('Invalid hour format');
  if (hours < 0 || hours > 23) throw new Error('Invalid hour value');

  return hours * 60;
}

/**
 * Normalize an hour input into canonical 2-digit "HH" string.
 */
export function normalizeHourToHH(hourStr) {
  if (typeof hourStr !== 'string') {
    throw new Error('Invalid hour format');
  }
  const match = hourStr.trim().match(/^(\d{1,2})$/);
  if (!match) throw new Error('Invalid hour format');
  const hours = Number(match[1]);
  if (!Number.isInteger(hours)) throw new Error('Invalid hour format');
  if (hours < 0 || hours > 23) throw new Error('Invalid hour value');
  return String(hours).padStart(2, '0');
}

