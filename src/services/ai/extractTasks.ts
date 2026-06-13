import { ExtractedTask } from '@/types';
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
 * Recommended approach: send the transcript to an LLM and ask for a strict JSON
 * array of tasks. Let the model do task-splitting + categorization + reminder
 * extraction in one shot, then fall back to the mock parsers for any field the
 * model leaves null. Keep the categories enum identical to CategoryId.
 *
 * IMPORTANT: do not embed the API key in the app bundle. Proxy this call
 * through a Supabase Edge Function and read config.aiApiBaseUrl from there.
 *
 * Example (pseudocode) using a chat/completions-style JSON endpoint:
 *
 *   const res = await fetch(`${config.aiApiBaseUrl}/chat/completions`, {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       Authorization: `Bearer ${config.aiApiKey}`,
 *     },
 *     body: JSON.stringify({
 *       model: 'gpt-4o-mini', // or an Anthropic model via its Messages API
 *       response_format: { type: 'json_object' },
 *       messages: [
 *         { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
 *         { role: 'user', content: text },
 *       ],
 *     }),
 *   });
 *   const json = await res.json();
 *   const parsed = JSON.parse(json.choices[0].message.content);
 *   return parsed.tasks.map(normalizeExtractedTask);
 *
 * The system prompt should:
 *   - instruct the model to answer in Hebrew,
 *   - return ONLY JSON: { "tasks": [{ title, category, reminder_phrase }] },
 *   - constrain category to the CategoryId enum,
 *   - return the raw Hebrew time phrase so parseHebrewReminder can resolve it
 *     to an absolute date on-device (timezone-correct).
 */
export async function extractTasksReal(text: string, now: Date = new Date()): Promise<ExtractedTask[]> {
  // TODO: implement the real LLM call described above.
  // For now, degrade gracefully to the mock so the UI keeps working.
  void config;
  return extractTasksMock(text, now);
}

export async function extractTasks(text: string, now: Date = new Date()): Promise<ExtractedTask[]> {
  return config.useRealAi ? extractTasksReal(text, now) : extractTasksMock(text, now);
}
