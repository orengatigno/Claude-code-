# תזכורות קוליות — Hebrew Voice-First Tasks (MVP)

A personal, voice-first reminder & task app in Hebrew. Tap once, talk, and the
app saves the original audio, transcribes it, extracts tasks, categorizes them,
detects Hebrew reminder times, and groups everything for you. Also supports
photos (OCR → tasks). Full Hebrew RTL UI.

> **Status:** MVP scaffold. The AI pipeline runs on **offline mock functions**
> by default so the whole app works with zero keys. Real API calls are stubbed
> with clear `TODO` integration points (see _Wiring real AI_ below).

---

## Quick start

```bash
npm install
npm start         # then press i / a, or scan the QR with Expo Go
```

No environment variables are required to run the mock experience. To enable the
real backend, copy `.env.example` → `.env` and fill it in.

---

## Feature map

| # | Feature | Where |
|---|---------|-------|
| 1 | One-tap big Record button | `src/components/RecordButton.tsx`, `src/screens/HomeScreen.tsx` |
| 2 | Save original audio | `src/services/storage/files.ts` (`storeAudio`) |
| 3 | Hebrew transcription | `src/services/ai/transcribe.ts` |
| 4 | Task extraction | `src/services/ai/extractTasks.ts` |
| 5 | Smart categorization | `src/services/ai/categorize.ts`, `src/constants/categories.ts` |
| 6 | Hebrew reminder-time detection | `src/services/reminders/hebrewDateParser.ts` |
| 7 | No time → Inbox + "needs scheduling" | `extractTasks.ts` (status logic) |
| 8 | Tasks grouped by category | `src/screens/TasksScreen.tsx`, `src/components/CategorySection.tsx` |
| 9 | Mark done / edit / recategorize / reschedule | `src/screens/TaskDetailScreen.tsx`, `src/store/useTasksStore.ts` |
| 10 | Image input → OCR → tasks | `src/services/ai/ocr.ts`, `HomeScreen.handleAddPhoto` |
| 11 | Hebrew RTL | `App.tsx` (`I18nManager.forceRTL`) + `row-reverse` layouts |
| 12 | Original voice note attached to each task | `tasks.source_id` → `voice_notes`, surfaced in `TaskDetailScreen` |

Post-recording confirmation (e.g. _"מצאתי 3 משימות. אחת לבית, אחת לפיננסים, אחת לעילאי."_)
is built in `src/constants/strings.ts` → `buildConfirmation`.

---

## Architecture

```
App.tsx ──> Navigation ──> Screens (Home / Tasks / TaskDetail)
                               │
                               ▼
                       useTasksStore (zustand, persisted)
                               │  orchestrates the pipeline
        ┌──────────────────────┼───────────────────────────┐
        ▼                      ▼                            ▼
  services/ai            services/storage            services/reminders
  transcribe / ocr       files (audio/img)           hebrewDateParser
  extractTasks           repository (Supabase)        + notifications
  categorize
```

- **Offline-first:** `useTasksStore` is the in-app source of truth and persists
  to `AsyncStorage`. Supabase + file uploads are **best-effort write-through** —
  if not configured, everything still works locally.
- **Mock ⇄ real toggle:** each AI module exports `*Mock`, `*Real` (TODO), and a
  dispatcher that reads `EXPO_PUBLIC_USE_REAL_AI`.

---

## Categories

`home, finance, kids, ilay, ella, isabelle, work, airbnb, shopping, legal, inbox`
— defined once in `src/constants/categories.ts` (Hebrew labels, emoji, colors,
keywords) and mirrored in the DB enum in `supabase/schema.sql`.

## Hebrew reminder phrases

`hebrewDateParser.ts` resolves phrases to absolute times, including:
`עוד שעה`, `עוד שעתיים`, `מחר בבוקר`, `מחר בערב`, `ביום ראשון`, `בערב`,
`שבוע הבא`, `עוד X שעות/דקות`, `מחרתיים`, explicit clock times (`ב-15:30`).
If nothing is detected, the task is created with status `needs_scheduling`.

---

## Database (Supabase)

Run `supabase/schema.sql` in the Supabase SQL editor. It creates:

- `voice_notes (id, audio_url, transcript, created_at)`
- `tasks (id, title, description, category, source_type, source_id, due_at,
  reminder_at, status, confidence, created_at, updated_at)`
- `images (id, image_url, extracted_text, created_at)`
- storage buckets `voice-notes` and `images`.

> RLS is intentionally off for this single-user MVP. Enable it before
> multi-user use (see the note at the bottom of the schema).

---

## Wiring real AI

All three integration points degrade gracefully to the mock today. To go live:

1. Set `EXPO_PUBLIC_USE_REAL_AI=true` and provide keys in `.env`.
2. Implement the `*Real` functions (each has a worked pseudocode example):
   - `transcribeReal` — speech-to-text with `language=he` (e.g. Whisper).
   - `ocrReal` — vision-LLM or OCR service.
   - `extractTasksReal` — LLM returns strict JSON tasks; keep the category enum
     identical to `CategoryId`, and return raw Hebrew time phrases so the
     on-device parser resolves them in the correct timezone.

**Security:** do **not** ship a provider API key inside the app bundle. Proxy
all AI calls through a Supabase Edge Function (or your own backend) and keep the
key server-side. The `EXPO_PUBLIC_AI_*` vars are for local prototyping only.

---

## Tech

React Native / Expo · TypeScript · Zustand · Supabase (`@supabase/supabase-js`)
· `expo-av` · `expo-image-picker` · `expo-notifications` · `expo-file-system`.
