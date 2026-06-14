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
 * REAL transcription — OpenAI Whisper (or any compatible /audio/transcriptions
 * endpoint) with the Hebrew language hint.
 *
 * SECURITY NOTE: for a personal single-user app this calls the API directly
 * with the key from .env. That key ships in the app bundle — acceptable for a
 * private build, but before sharing the app, move this call behind a Supabase
 * Edge Function so the key stays server-side.
 */
export async function transcribeReal(audioUri: string): Promise<string> {
  if (!config.aiApiKey) {
    throw new Error('Missing EXPO_PUBLIC_AI_API_KEY — set it in .env to use real transcription.');
  }

  const form = new FormData();
  // React Native FormData accepts a { uri, name, type } file object.
  form.append('file', {
    uri: audioUri,
    name: 'note.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  form.append('model', config.transcriptionModel);
  form.append('language', 'he'); // Hebrew
  form.append('response_format', 'json');

  const res = await fetch(`${config.aiApiBaseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.aiApiKey}`,
      // NOTE: do NOT set Content-Type — fetch sets the multipart boundary.
    },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Transcription failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { text?: string };
  return (json.text ?? '').trim();
}

export async function transcribe(audioUri: string): Promise<string> {
  return config.useRealAi ? transcribeReal(audioUri) : transcribeMock(audioUri);
}
