import { config } from '@/lib/config';

// ============================================================================
// Image OCR (Hebrew + English)
// ----------------------------------------------------------------------------
// ocrMock:  returns canned extracted text (offline demo).
// ocrReal:  TODO — calls an OCR / vision API.
// ============================================================================

const MOCK_OCR_TEXTS = [
  'רשימת קניות: חלב, ביצים, לחם, ירקות. לשלם ארנונה עד מחר.',
  'תזכורת מבית הספר: לשלוח אישור הורים לעילאי ביום ראשון.',
];

let mockIndex = 0;

export async function ocrMock(_imageUri: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  const text = MOCK_OCR_TEXTS[mockIndex % MOCK_OCR_TEXTS.length];
  mockIndex += 1;
  return text;
}

/**
 * REAL OCR — TODO.
 *
 * Two common options:
 *   1. A multimodal LLM (vision): send the image as a base64 data URL and ask
 *      it to return all readable Hebrew/English text verbatim.
 *   2. A dedicated OCR service (e.g. Google Cloud Vision) with Hebrew enabled.
 *
 * Vision-LLM example (pseudocode):
 *
 *   const base64 = await FileSystem.readAsStringAsync(imageUri, {
 *     encoding: FileSystem.EncodingType.Base64,
 *   });
 *   const res = await fetch(`${config.aiApiBaseUrl}/chat/completions`, {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       Authorization: `Bearer ${config.aiApiKey}`,
 *     },
 *     body: JSON.stringify({
 *       model: 'gpt-4o-mini',
 *       messages: [{
 *         role: 'user',
 *         content: [
 *           { type: 'text', text: 'החזר את כל הטקסט שמופיע בתמונה, מילה במילה.' },
 *           { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
 *         ],
 *       }],
 *     }),
 *   });
 *   const json = await res.json();
 *   return json.choices[0].message.content;
 *
 * Proxy through a Supabase Edge Function so the key stays server-side.
 */
export async function ocrReal(imageUri: string): Promise<string> {
  // TODO: implement the real OCR call described above.
  void config;
  return ocrMock(imageUri);
}

export async function ocr(imageUri: string): Promise<string> {
  return config.useRealAi ? ocrReal(imageUri) : ocrMock(imageUri);
}
