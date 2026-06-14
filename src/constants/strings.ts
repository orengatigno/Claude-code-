import { CategoryId } from '@/types';
import { getCategory } from './categories';

// Central place for all Hebrew UI copy. Single language for the MVP.
export const STR = {
  appTitle: 'תזכורות קוליות',
  home: {
    tapToRecord: 'הקש כדי להקליט',
    recording: 'מקליט… הקש לסיום',
    processing: 'מעבד את ההקלטה…',
    addPhoto: 'הוסף תמונה',
    viewTasks: 'המשימות שלי',
    micPermission: 'צריך הרשאת מיקרופון כדי להקליט.',
  },
  tasks: {
    title: 'המשימות שלי',
    empty: 'אין עדיין משימות. הקש על הכפתור הגדול כדי להתחיל.',
    needsScheduling: 'דורש תזמון',
    done: 'בוצע',
    markDone: 'סמן כבוצע',
    markOpen: 'החזר לפתוח',
    edit: 'עריכה',
    delete: 'מחיקה',
    listenOriginal: 'האזן להקלטה המקורית',
    stopPlaying: 'עצור',
    noReminder: 'ללא תזכורת',
    reminderAt: 'תזכורת:',
  },
  detail: {
    title: 'עריכת משימה',
    taskTitle: 'כותרת',
    description: 'תיאור',
    category: 'קטגוריה',
    reminder: 'תזכורת',
    setReminder: 'קבע תזכורת',
    clearReminder: 'בטל תזכורת',
    save: 'שמירה',
    cancel: 'ביטול',
    source: 'מקור',
    sourceVoice: 'הערה קולית',
    sourceImage: 'תמונה',
    sourceManual: 'הוזן ידנית',
    transcript: 'תמלול',
  },
  common: {
    error: 'משהו השתבש. נסה שוב.',
    close: 'סגור',
  },
};

/**
 * Builds the post-recording confirmation, e.g.:
 *   "מצאתי 3 משימות. אחת לבית, אחת לפיננסים, אחת ל-Ilay."
 */
export function buildConfirmation(categories: CategoryId[]): string {
  const count = categories.length;
  if (count === 0) return 'לא מצאתי משימות בהקלטה.';

  const taskWord = count === 1 ? 'משימה אחת' : `${count} משימות`;
  const phrases = categories.map((id) => `אחת ${getCategory(id).inflected}`);
  return `מצאתי ${taskWord}. ${phrases.join(', ')}.`;
}
