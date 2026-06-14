import { CategoryId, ExtractedTask } from '@/types';
import { config } from '@/lib/config';
import { parseHebrewReminder } from '@/services/reminders/hebrewDateParser';
import { categorizeByKeywords } from './categorize';

// ============================================================================
// Task extraction
// ----------------------------------------------------------------------------
// Turns a block of Hebrew text (from transcription or OCR) into structured
// tasks: title, category, reminder time, status, confidence.
//
// Two implementations:
//   - extractTasksMock:  offline, rule-based. Used by default.
//   - extractTasksReal:  TODO — calls an LLM. Integration point sketched below.
//
// `extractTasks` dispatches based on the EXPO_PUBLIC_USE_REAL_AI flag.
// ============================================================================

// Connectors people use to string multiple tasks together in one breath.
const SPLIT_PATTERN = /\s*(?:,|\.|;|\bוגם\b|\bאחר כך\b|\bובנוסף\b|\bצריך גם\b|\bותזכיר לי\b|\n)\s*/;

// Imperative-ish lead-ins that usually start a task in Hebrew.
const TASK_HINTS = [
  'צריך',
  'צריכה',
  'לזכור',
  'תזכיר',
  'להזכיר',
  'לקנות',
  'להתקשר',
  'לשלם',
  'לקבוע',
  'לשלוח',
  'לסדר',
  'להזמין',
  'לבדוק',
  'לקחת',
  'להביא',
  'לתאם',
];

function looksLikeTask(segment: string): boolean {
  const s = segment.trim();
  if (s.length < 3) return false;
  return TASK_HINTS.some((h) => s.includes(h)) || s.split(/\s+/).length >= 2;
}

/** Strip a leading "צריך/תזכיר לי" so the title reads cleanly. */
function cleanTitle(segment: string): string {
  return segment
    .replace(/^\s*(אז\s+)?(צריך|צריכה|לזכור|תזכיר לי|להזכיר לי|אני צריך|אני צריכה)\s+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * MOCK extraction — fully offline, deterministic.
 * Splits text into candidate tasks, categorizes each, and parses reminders.
 */
export function extractTasksMock(text: string, now: Date = new Date()): ExtractedTask[] {
  if (!text?.trim()) return [];

  const segments = text
    .split(SPLIT_PATTERN)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(looksLikeTask);

  const tasks: ExtractedTask[] = segments.map((segment) => {
    const { category, confidence } = categorizeByKeywords(segment);
    const reminder = parseHebrewReminder(segment, now);
    const title = cleanTitle(segment) || segment;

    return {
      title,
      description: null,
      category,
      reminder_at: reminder.date ? reminder.date.toISOString() : null,
      due_at: reminder.date ? reminder.date.toISOString() : null,
      // Feature #7: no clear reminder -> Inbox + "needs scheduling".
      status: reminder.date ? 'open' : 'needs_scheduling',
      confidence,
    };
  });

  // If nothing matched the task heuristics but there's text, keep the whole
  // thing as a single inbox task so the user never loses a thought.
  if (tasks.length === 0 && text.trim().length > 0) {
    const reminder = parseHebrewReminder(text, now);
    return [
      {
        title: cleanTitle(text).slice(0, 120) || text.slice(0, 120),
        description: null,
        category: categorizeByKeywords(text).category,
        reminder_at: reminder.date ? reminder.date.toISOString() : null,
        due_at: reminder.date ? reminder.date.toISOString() : null,
        status: reminder.date ? 'open' : 'needs_scheduling',
        confidence: 0.3,
      },
    ];
  }

  return tasks;
}

/**
 * REAL extraction — TODO.
 *
 * The model splits the transcript into tasks, categorizes each, and returns the
 * RAW Hebrew time phrase. We resolve that phrase to an absolute date on-device
 * with parseHebrewReminder so the timezone is always the phone's.
 */
const VALID_CATEGORIES: CategoryId[] = [
  'home', 'finance', 'kids', 'ilay', 'ella', 'isabelle',
  'work', 'airbnb', 'shopping', 'legal', 'inbox',
];

const EXTRACTION_SYSTEM_PROMPT = `אתה עוזר אישי שמקבל תמלול בעברית של הודעה קולית ומחלץ ממנה משימות.
החזר JSON בלבד בפורמט: { "tasks": [ { "title": string, "category": string, "reminder_phrase": string } ] }

כללים:
- "title": ניסוח קצר וברור של המשימה בעברית (פעולה אחת לכל משימה).
- "category": אחת מהקטגוריות הבאות בלבד (באנגלית):
  home (בית), finance (כספים/תשלומים/בנק), kids (ילדים כללי), ilay (עילאי),
  ella (אלה), isabelle (איזבל), work (עבודה), airbnb (השכרות/אורחים),
  shopping (קניות/סידורים), legal (משפטי/בירוקרטיה/חוזים/אדמות/נדל"ן), inbox (כללי/לא ברור).
- אם המשימה לא מתאימה לאף קטגוריה ספציפית, השתמש ב-"inbox".
- "reminder_phrase": העתק את ביטוי הזמן בעברית כפי שנאמר (למשל "מחר בבוקר", "עוד שעה", "ביום ראשון"). אם אין זמן, החזר מחרוזת ריקה "".
- אם אין משימות כלל, החזר { "tasks": [] }.
- אל תמציא משימות שלא נאמרו.`;

export async function extractTasksReal(text: string, now: Date = new Date()): Promise<ExtractedTask[]> {
  if (!config.aiApiKey) {
    throw new Error('Missing EXPO_PUBLIC_AI_API_KEY — set it in .env to use real extraction.');
  }

  const res = await fetch(`${config.aiApiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: config.extractionModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Extraction failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? '{"tasks":[]}';

  let parsed: { tasks?: { title?: string; category?: string; reminder_phrase?: string }[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    // If the model returned non-JSON, fall back to the on-device parser.
    return extractTasksMock(text, now);
  }

  const rawTasks = parsed.tasks ?? [];
  return rawTasks
    .filter((t) => t.title && t.title.trim())
    .map((t) => {
      const category: CategoryId = VALID_CATEGORIES.includes(t.category as CategoryId)
        ? (t.category as CategoryId)
        : 'inbox';
      const reminder = t.reminder_phrase
        ? parseHebrewReminder(t.reminder_phrase, now)
        : { date: null };
      const reminderIso = reminder.date ? reminder.date.toISOString() : null;

      return {
        title: t.title!.trim(),
        description: null,
        category,
        reminder_at: reminderIso,
        due_at: reminderIso,
        status: reminderIso ? 'open' : 'needs_scheduling',
        confidence: 0.9,
      } satisfies ExtractedTask;
    });
}

export async function extractTasks(text: string, now: Date = new Date()): Promise<ExtractedTask[]> {
  return config.useRealAi ? extractTasksReal(text, now) : extractTasksMock(text, now);
}
