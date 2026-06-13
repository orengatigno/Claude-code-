// Hebrew-friendly date formatting + quick reminder presets.

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** e.g. "מחר 08:00", "היום 19:00", "יום שלישי 09:00", "12/06 09:00". */
export function formatReminder(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameDay(d, now)) return `היום ${time}`;
  if (isSameDay(d, tomorrow)) return `מחר ${time}`;

  const within7 = (d.getTime() - now.getTime()) / 86_400_000 < 7;
  if (within7 && d.getTime() > now.getTime()) {
    return `יום ${HE_DAYS[d.getDay()]} ${time}`;
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${time}`;
}

export interface ReminderPreset {
  label: string;
  compute: (now?: Date) => Date;
}

// Quick-pick presets surfaced in the task detail screen.
export const REMINDER_PRESETS: ReminderPreset[] = [
  {
    label: 'עוד שעה',
    compute: (now = new Date()) => new Date(now.getTime() + 3600_000),
  },
  {
    label: 'מחר בבוקר',
    compute: (now = new Date()) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    },
  },
  {
    label: 'הערב',
    compute: (now = new Date()) => {
      const d = new Date(now);
      d.setHours(19, 0, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: 'שבוע הבא',
    compute: (now = new Date()) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];
