import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CategoryId, ImageNote, Task, VoiceNote } from '@/types';
import { transcribe } from '@/services/ai/transcribe';
import { ocr } from '@/services/ai/ocr';
import { extractTasks } from '@/services/ai/extractTasks';
import { storeAudio, storeImage } from '@/services/storage/files';
import {
  createImageNote,
  createTasks,
  createVoiceNote,
  deleteTask as repoDeleteTask,
  updateTask as repoUpdateTask,
} from '@/services/storage/repository';
import { cancelReminder, scheduleTaskReminder } from '@/services/notifications';

interface ProcessResult {
  tasks: Task[];
  categories: CategoryId[];
}

interface TasksState {
  tasks: Task[];
  voiceNotes: Record<string, VoiceNote>;
  images: Record<string, ImageNote>;
  /** notificationId per task, so we can cancel/reschedule. */
  reminderIds: Record<string, string>;
  isProcessing: boolean;

  processVoiceNote: (audioUri: string) => Promise<ProcessResult>;
  processImage: (imageUri: string) => Promise<ProcessResult>;

  toggleDone: (id: string) => Promise<void>;
  editTask: (id: string, patch: Partial<Task>) => Promise<void>;
  setReminder: (id: string, reminderIso: string | null) => Promise<void>;
  removeTask: (id: string) => Promise<void>;

  voiceNoteFor: (task: Task) => VoiceNote | null;
}

async function rescheduleReminder(
  get: () => TasksState,
  set: (partial: Partial<TasksState>) => void,
  task: Task,
): Promise<void> {
  const existing = get().reminderIds[task.id];
  if (existing) {
    await cancelReminder(existing).catch(() => {});
    const next = { ...get().reminderIds };
    delete next[task.id];
    set({ reminderIds: next });
  }
  if (task.reminder_at && task.status !== 'done') {
    const notifId = await scheduleTaskReminder(task).catch(() => null);
    if (notifId) {
      set({ reminderIds: { ...get().reminderIds, [task.id]: notifId } });
    }
  }
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      voiceNotes: {},
      images: {},
      reminderIds: {},
      isProcessing: false,

      // Feature #2/#3/#4/#12 — the voice pipeline.
      processVoiceNote: async (audioUri) => {
        set({ isProcessing: true });
        try {
          const stored = await storeAudio(audioUri); // keep the original
          const transcript = await transcribe(stored.localUri);
          const note = await createVoiceNote({
            audio_url: stored.remoteUrl ?? stored.localUri,
            transcript,
          });
          // Track local uri too, so playback works offline.
          const noteWithLocal: VoiceNote = { ...note, audio_url: stored.localUri };

          const extracted = await extractTasks(transcript);
          const tasks = await createTasks(extracted, { type: 'voice', id: note.id });

          set({
            voiceNotes: { ...get().voiceNotes, [note.id]: noteWithLocal },
            tasks: [...tasks, ...get().tasks],
          });

          for (const t of tasks) await rescheduleReminder(get, set, t);
          return { tasks, categories: tasks.map((t) => t.category) };
        } finally {
          set({ isProcessing: false });
        }
      },

      // Feature #10 — the image pipeline (mirrors the voice pipeline).
      processImage: async (imageUri) => {
        set({ isProcessing: true });
        try {
          const stored = await storeImage(imageUri);
          const text = await ocr(stored.localUri);
          const note = await createImageNote({
            image_url: stored.remoteUrl ?? stored.localUri,
            extracted_text: text,
          });
          const noteWithLocal: ImageNote = { ...note, image_url: stored.localUri };

          const extracted = await extractTasks(text);
          const tasks = await createTasks(extracted, { type: 'image', id: note.id });

          set({
            images: { ...get().images, [note.id]: noteWithLocal },
            tasks: [...tasks, ...get().tasks],
          });

          for (const t of tasks) await rescheduleReminder(get, set, t);
          return { tasks, categories: tasks.map((t) => t.category) };
        } finally {
          set({ isProcessing: false });
        }
      },

      toggleDone: async (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const status = task.status === 'done' ? (task.reminder_at ? 'open' : 'needs_scheduling') : 'done';
        const updated: Task = { ...task, status, updated_at: new Date().toISOString() };
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
        await repoUpdateTask(id, { status });
        await rescheduleReminder(get, set, updated);
      },

      editTask: async (id, patch) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const updated: Task = { ...task, ...patch, updated_at: new Date().toISOString() };
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
        await repoUpdateTask(id, patch);
        if ('reminder_at' in patch || 'status' in patch) {
          await rescheduleReminder(get, set, updated);
        }
      },

      setReminder: async (id, reminderIso) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const status: Task['status'] =
          task.status === 'done' ? 'done' : reminderIso ? 'open' : 'needs_scheduling';
        const updated: Task = {
          ...task,
          reminder_at: reminderIso,
          due_at: reminderIso ?? task.due_at,
          status,
          updated_at: new Date().toISOString(),
        };
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
        await repoUpdateTask(id, { reminder_at: reminderIso, due_at: updated.due_at, status });
        await rescheduleReminder(get, set, updated);
      },

      removeTask: async (id) => {
        const existing = get().reminderIds[id];
        if (existing) await cancelReminder(existing).catch(() => {});
        const reminderIds = { ...get().reminderIds };
        delete reminderIds[id];
        set({ tasks: get().tasks.filter((t) => t.id !== id), reminderIds });
        await repoDeleteTask(id);
      },

      voiceNoteFor: (task) => {
        if (task.source_type === 'voice' && task.source_id) {
          return get().voiceNotes[task.source_id] ?? null;
        }
        return null;
      },
    }),
    {
      name: 'hebrew-voice-tasks',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient processing flag.
      partialize: ({ tasks, voiceNotes, images, reminderIds }) => ({
        tasks,
        voiceNotes,
        images,
        reminderIds,
      }),
    },
  ),
);
