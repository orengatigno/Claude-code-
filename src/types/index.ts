// Shared domain types. Mirrors supabase/schema.sql.

export type CategoryId =
  | 'home'
  | 'finance'
  | 'kids'
  | 'ilay'
  | 'ella'
  | 'isabelle'
  | 'work'
  | 'airbnb'
  | 'shopping'
  | 'legal'
  | 'inbox';

export type TaskStatus = 'open' | 'needs_scheduling' | 'done';

export type SourceType = 'voice' | 'image' | 'manual';

export interface VoiceNote {
  id: string;
  audio_url: string | null;
  transcript: string | null;
  created_at: string;
}

export interface ImageNote {
  id: string;
  image_url: string | null;
  extracted_text: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: CategoryId;
  source_type: SourceType;
  source_id: string | null;
  due_at: string | null;
  reminder_at: string | null;
  status: TaskStatus;
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Result of running AI extraction over a transcript or OCR text.
 * Produced by the AI service layer (mock or real) before tasks are persisted.
 */
export interface ExtractedTask {
  title: string;
  description?: string | null;
  category: CategoryId;
  /** ISO string if a reminder time was detected, otherwise null. */
  reminder_at: string | null;
  due_at?: string | null;
  status: TaskStatus;
  confidence: number;
}
