// ============================================================================
// Hebrew reminder-time parser
// ----------------------------------------------------------------------------
// Detects common Hebrew time expressions in free text and returns an absolute
// reminder Date. Pure, dependency-free, and unit-testable so it works the same
// whether we use mock or real AI extraction.
//
// Handles (and more):
//   "עוד שעה"        -> now + 1h
//   "עוד שעתיים"     -> now + 2h
//   "מחר בבוקר"      -> tomorrow 08:00
//   "מחר בערב"       -> tomorrow 19:00
//   "ביום ראשון"     -> next Sunday 09:00
//   "בערב"           -> today/tomorrow 19:00
//   "שבוע הבא"       -> +7 days 09:00
// ============================================================================

export interface ParsedReminder {
  /** Absolute time for the reminder, or null if nothing was detected. */
  date: Date | null;
  /** The matched Hebrew phrase, for debugging / UI. */
  matchedPhrase: string | null;
}

const DEFAULT_MORNING_HOUR = 8;
const DEFAULT_NOON_HOUR = 13;
const DEFAULT_EVENING_HOUR = 19;
const DEFAULT_NIGHT_HOUR = 21;
const DEFAULT_DAY_HOUR = 9; // fallback when only a day is known

// Hebrew weekday names -> JS getDay() index (Sunday = 0).
const WEEKDAYS: Record<string, number> = {
  ראשון: 0,
  שני: 1,
  שלישי: 2,
  רביעי: 3,
  חמישי: 4,
  שישי: 5,
  שבת: 6,
};

function atHour(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Maps a part-of-day word to an hour. Returns null if none present. */
function hourForPartOfDay(text: string): number | null {
  if (/בבוקר|בוקר/.test(text)) return DEFAULT_MORNING_HOUR;
  if (/בצהריים|צהריים/.test(text)) return DEFAULT_NOON_HOUR;
  if (/בערב|ערב/.test(text)) return DEFAULT_EVENING_HOUR;
  if (/בלילה|לילה/.test(text)) return DEFAULT_NIGHT_HOUR;
  return null;
}

/** Days until the next occurrence of weekday `target` (strictly in the future). */
function daysUntilWeekday(from: Date, target: number): number {
  const diff = (target - from.getDay() + 7) % 7;
  return diff === 0 ? 7 : diff;
}

/**
 * Parse an explicit clock time like "ב-15:30" or "בשעה 9".
 * Returns {hour, minute} or null.
 */
function parseClock(text: string): { hour: number; minute: number } | null {
  const hhmm = text.match(/(\d{1,2}):(\d{2})/);
  if (hhmm) {
    return { hour: Number(hhmm[1]), minute: Number(hhmm[2]) };
  }
  const atHourMatch = text.match(/בשעה\s+(\d{1,2})/);
  if (atHourMatch) {
    return { hour: Number(atHourMatch[1]), minute: 0 };
  }
  return null;
}

/**
 * Detects a reminder time inside `text`.
 * @param now Injectable "current time" for deterministic testing.
 */
export function parseHebrewReminder(text: string, now: Date = new Date()): ParsedReminder {
  if (!text) return { date: null, matchedPhrase: null };

  const clock = parseClock(text);
  const partOfDayHour = hourForPartOfDay(text);

  const applyTime = (base: Date, fallbackHour: number): Date => {
    if (clock) return atHour(base, clock.hour, clock.minute);
    if (partOfDayHour !== null) return atHour(base, partOfDayHour);
    return atHour(base, fallbackHour);
  };

  // --- relative: "עוד X שעות/דקות/ימים" -------------------------------------
  // "עוד שעה" / "עוד שעתיים" / "עוד 3 שעות"
  if (/עוד\s+שעתיים/.test(text)) {
    return { date: new Date(now.getTime() + 2 * 3600_000), matchedPhrase: 'עוד שעתיים' };
  }
  if (/עוד\s+שעה/.test(text)) {
    return { date: new Date(now.getTime() + 3600_000), matchedPhrase: 'עוד שעה' };
  }
  const inHours = text.match(/עוד\s+(\d{1,2})\s+שעות/);
  if (inHours) {
    return {
      date: new Date(now.getTime() + Number(inHours[1]) * 3600_000),
      matchedPhrase: inHours[0],
    };
  }
  if (/עוד\s+חצי\s+שעה/.test(text)) {
    return { date: new Date(now.getTime() + 30 * 60_000), matchedPhrase: 'עוד חצי שעה' };
  }
  const inMinutes = text.match(/עוד\s+(\d{1,3})\s+דקות/);
  if (inMinutes) {
    return {
      date: new Date(now.getTime() + Number(inMinutes[1]) * 60_000),
      matchedPhrase: inMinutes[0],
    };
  }
  const inDays = text.match(/עוד\s+(\d{1,2})\s+ימים/);
  if (inDays) {
    return {
      date: applyTime(addDays(now, Number(inDays[1])), DEFAULT_DAY_HOUR),
      matchedPhrase: inDays[0],
    };
  }

  // --- "מחרתיים" / "מחר" ----------------------------------------------------
  if (/מחרתיים/.test(text)) {
    return { date: applyTime(addDays(now, 2), DEFAULT_MORNING_HOUR), matchedPhrase: 'מחרתיים' };
  }
  if (/מחר/.test(text)) {
    return { date: applyTime(addDays(now, 1), DEFAULT_MORNING_HOUR), matchedPhrase: 'מחר' };
  }

  // --- "היום" ---------------------------------------------------------------
  if (/היום/.test(text)) {
    return { date: applyTime(now, DEFAULT_EVENING_HOUR), matchedPhrase: 'היום' };
  }

  // --- "שבוע הבא" / "בשבוע הבא" ---------------------------------------------
  if (/שבוע\s+הבא/.test(text)) {
    return { date: applyTime(addDays(now, 7), DEFAULT_DAY_HOUR), matchedPhrase: 'שבוע הבא' };
  }

  // --- weekday: "ביום ראשון", "ביום שלישי הבא" ------------------------------
  const weekdayMatch = text.match(/ביום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/);
  if (weekdayMatch) {
    const target = WEEKDAYS[weekdayMatch[1]];
    const base = addDays(now, daysUntilWeekday(now, target));
    return { date: applyTime(base, DEFAULT_DAY_HOUR), matchedPhrase: weekdayMatch[0] };
  }

  // --- bare part-of-day: "בערב", "בבוקר" ------------------------------------
  if (partOfDayHour !== null) {
    // If the part of day already passed today, roll to tomorrow.
    const candidate = atHour(now, partOfDayHour);
    const base = candidate.getTime() <= now.getTime() ? addDays(now, 1) : now;
    return { date: atHour(base, partOfDayHour), matchedPhrase: 'חלק מהיום' };
  }

  // --- bare clock time: "ב-15:30" -------------------------------------------
  if (clock) {
    const candidate = atHour(now, clock.hour, clock.minute);
    const base = candidate.getTime() <= now.getTime() ? addDays(now, 1) : now;
    return { date: atHour(base, clock.hour, clock.minute), matchedPhrase: 'שעה' };
  }

  return { date: null, matchedPhrase: null };
}
