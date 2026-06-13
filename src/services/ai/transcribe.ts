import { config } from '@/lib/config';

// ============================================================================
// Hebrew audio transcription
// ----------------------------------------------------------------------------
// transcribeMock:  returns canned Hebrew transcripts (offline demo).
// transcribeReal:  TODO — calls a speech-to-text API (e.g. OpenAI Whisper).
// ============================================================================

// Rotating sample transcripts so the mock feels alive while developing the UI.
const MOCK_TRANSCRIPTS = [
  'צריך לקנות חלב ולחם בסופר, ולהתקשר לחשמלאי לגבי הבית מחר בבוקר.',
  'תזכיר לי לשלם את החשבון בבנק עוד שעה, וגם לקבוע תור לעילאי אצל הרופא ביום ראשון.',
  'לתאם עם האורחים של ה-Airbnb צ׳ק אין לשבוע הבא, ולסדר את החוזה עם עורך הדין.',
  'לקחת את אלה לחוג בערב, ולהזמין מתנה לאיזבל.',
];

let mockIndex = 0;

/**
 * MOCK transcription — ignores the audio and returns a sample Hebrew sentence.
 */
export async function transcribeMock(_audioUri: string): Promise<string> {
  // Simulate a little processing latency.
  await new Promise((r) => setTimeout(r, 600));
  const transcript = MOCK_TRANSCRIPTS[mockIndex % MOCK_TRANSCRIPTS.length];
  mockIndex += 1;
  return transcript;
}

/**
 * REAL transcription — TODO.
 *
 * Upload the recorded file to a speech-to-text endpoint with the Hebrew
 * language hint. With OpenAI Whisper this is a multipart POST to
 * `${config.aiApiBaseUrl}/audio/transcriptions` with `model=whisper-1` and
 * `language=he`. Again: proxy through a Supabase Edge Function in production so
 * the API key stays server-side.
 *
 * Example (pseudocode):
 *
 *   const form = new FormData();
 *   form.append('file', { uri: audioUri, name: 'note.m4a', type: 'audio/m4a' } as any);
 *   form.append('model', 'whisper-1');
 *   form.append('language', 'he');
 *   const res = await fetch(`${config.aiApiBaseUrl}/audio/transcriptions`, {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${config.aiApiKey}` },
 *     body: form,
 *   });
 *   const json = await res.json();
 *   return json.text;
 */
export async function transcribeReal(audioUri: string): Promise<string> {
  // TODO: implement the real STT call described above.
  void config;
  return transcribeMock(audioUri);
}

export async function transcribe(audioUri: string): Promise<string> {
  return config.useRealAi ? transcribeReal(audioUri) : transcribeMock(audioUri);
}
