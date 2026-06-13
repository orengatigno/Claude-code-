import { supabase } from '@/lib/supabase';
import { ExtractedTask, ImageNote, Task, VoiceNote } from '@/types';

// ============================================================================
// Data repository
// ----------------------------------------------------------------------------
// Best-effort write-through to Supabase. The zustand store is the in-app
// source of truth (and persists locally), so every method here returns the
// rows it would persist even when Supabase is not configured. That keeps the
// app fully functional offline while staying ready for the real backend.
// ============================================================================

function uuid(): string {
  // RFC4122-ish; good enough for local ids. Supabase generates its own on insert.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createVoiceNote(input: {
  audio_url: string | null;
  transcript: string | null;
}): Promise<VoiceNote> {
  const local: VoiceNote = {
    id: uuid(),
    audio_url: input.audio_url,
    transcript: input.transcript,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('voice_notes')
      .insert({ audio_url: input.audio_url, transcript: input.transcript })
      .select()
      .single();
    if (!error && data) return data as VoiceNote;
    console.warn('[repo] createVoiceNote fell back to local:', error?.message);
  }
  return local;
}

export async function createImageNote(input: {
  image_url: string | null;
  extracted_text: string | null;
}): Promise<ImageNote> {
  const local: ImageNote = {
    id: uuid(),
    image_url: input.image_url,
    extracted_text: input.extracted_text,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('images')
      .insert({ image_url: input.image_url, extracted_text: input.extracted_text })
      .select()
      .single();
    if (!error && data) return data as ImageNote;
    console.warn('[repo] createImageNote fell back to local:', error?.message);
  }
  return local;
}

export async function createTasks(
  extracted: ExtractedTask[],
  source: { type: Task['source_type']; id: string | null },
): Promise<Task[]> {
  const now = new Date().toISOString();
  const locals: Task[] = extracted.map((e) => ({
    id: uuid(),
    title: e.title,
    description: e.description ?? null,
    category: e.category,
    source_type: source.type,
    source_id: source.id,
    due_at: e.due_at ?? null,
    reminder_at: e.reminder_at,
    status: e.status,
    confidence: e.confidence,
    created_at: now,
    updated_at: now,
  }));

  if (supabase && locals.length > 0) {
    const rows = locals.map(({ id, created_at, updated_at, ...rest }) => rest);
    const { data, error } = await supabase.from('tasks').insert(rows).select();
    if (!error && data) return data as Task[];
    console.warn('[repo] createTasks fell back to local:', error?.message);
  }
  return locals;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('tasks').update(patch).eq('id', id);
    if (error) console.warn('[repo] updateTask failed:', error.message);
  }
  // Store applies the patch locally regardless.
}

export async function deleteTask(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.warn('[repo] deleteTask failed:', error.message);
  }
}
