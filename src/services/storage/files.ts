// SDK 54 introduced a new File/Directory API; the classic functions used here
// (documentDirectory, copyAsync, readAsStringAsync, ...) live under /legacy.
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

// ============================================================================
// Original-file persistence (audio + images)
// ----------------------------------------------------------------------------
// Feature #2 / #12: always keep the ORIGINAL audio attached to its tasks.
//
// Strategy:
//   - Always copy the recording/photo into the app's persistent document dir
//     so the file survives even fully offline.
//   - If Supabase is configured, also upload to the matching storage bucket
//     and return the remote path. The local URI is kept as a fallback.
// ============================================================================

const AUDIO_DIR = `${FileSystem.documentDirectory}voice-notes/`;
const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export interface StoredFile {
  /** Local persistent URI (always set). */
  localUri: string;
  /** Remote URL/path if uploaded to Supabase storage, else null. */
  remoteUrl: string | null;
}

async function persistLocally(srcUri: string, dir: string, ext: string): Promise<string> {
  await ensureDir(dir);
  const dest = `${dir}${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: srcUri, to: dest });
  return dest;
}

async function uploadToBucket(
  bucket: string,
  localUri: string,
  contentType: string,
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Supabase JS accepts an ArrayBuffer; decode base64 to bytes.
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType,
      upsert: false,
    });
    if (error) {
      console.warn(`[storage] upload to ${bucket} failed:`, error.message);
      return null;
    }
    return path;
  } catch (e) {
    console.warn('[storage] upload error:', e);
    return null;
  }
}

export async function storeAudio(srcUri: string): Promise<StoredFile> {
  const localUri = await persistLocally(srcUri, AUDIO_DIR, 'm4a');
  const remoteUrl = await uploadToBucket('voice-notes', localUri, 'audio/m4a');
  return { localUri, remoteUrl };
}

export async function storeImage(srcUri: string): Promise<StoredFile> {
  const localUri = await persistLocally(srcUri, IMAGE_DIR, 'jpg');
  const remoteUrl = await uploadToBucket('images', localUri, 'image/jpeg');
  return { localUri, remoteUrl };
}
