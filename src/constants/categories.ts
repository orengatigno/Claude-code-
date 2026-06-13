import { CategoryId } from '@/types';

export interface CategoryMeta {
  id: CategoryId;
  /** Hebrew display label. */
  label: string;
  /** Short label used in confirmation sentences (e.g. "לבית"). */
  inflected: string;
  emoji: string;
  color: string;
  /** Keywords used by the mock categorizer to score a task into this category. */
  keywords: string[];
}

// Order here drives the order categories appear in the task list.
export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'home',
    label: 'בית',
    inflected: 'לבית',
    emoji: '🏠',
    color: '#0EA5E9',
    keywords: ['בית', 'דירה', 'תיקון', 'נקיון', 'ניקיון', 'גינה', 'חשמלאי', 'אינסטלטור', 'רהיט'],
  },
  {
    id: 'finance',
    label: 'פיננסים',
    inflected: 'לפיננסים',
    emoji: '💰',
    color: '#22C55E',
    keywords: ['כסף', 'תשלום', 'חשבון', 'בנק', 'הלוואה', 'משכנתא', 'ביטוח', 'מס', 'מיסים', 'העברה', 'כרטיס אשראי', 'רואה חשבון'],
  },
  {
    id: 'kids',
    label: 'ילדים',
    inflected: 'לילדים',
    emoji: '🧒',
    color: '#F59E0B',
    keywords: ['ילדים', 'ילד', 'ילדה', 'גן', 'בית ספר', 'שיעור', 'חוג', 'גננת', 'מורה', 'הורים'],
  },
  {
    id: 'ilay',
    label: 'עילאי',
    inflected: 'לעילאי',
    emoji: '👦',
    color: '#6366F1',
    keywords: ['עילאי', 'ilay', 'אילאי'],
  },
  {
    id: 'ella',
    label: 'אלה',
    inflected: 'לאלה',
    emoji: '👧',
    color: '#EC4899',
    keywords: ['אלה', 'ella'],
  },
  {
    id: 'isabelle',
    label: 'איזבל',
    inflected: 'לאיזבל',
    emoji: '👶',
    color: '#A855F7',
    keywords: ['איזבל', 'isabelle', 'איזבלה'],
  },
  {
    id: 'work',
    label: 'עבודה',
    inflected: 'לעבודה',
    emoji: '💼',
    color: '#0F766E',
    keywords: ['עבודה', 'פגישה', 'ישיבה', 'מייל', 'אימייל', 'לקוח', 'פרויקט', 'מצגת', 'דדליין', 'בוס', 'משרד'],
  },
  {
    id: 'airbnb',
    label: 'Airbnb / השכרות',
    inflected: 'ל-Airbnb',
    emoji: '🏡',
    color: '#FB7185',
    keywords: ['airbnb', 'אייר בי אנ בי', 'אורח', 'אורחים', 'השכרה', 'דייר', 'נקיון דירה', 'צ׳ק אין', 'צ׳ק אאוט', 'הזמנה'],
  },
  {
    id: 'shopping',
    label: 'קניות / סידורים',
    inflected: 'לקניות',
    emoji: '🛒',
    color: '#F97316',
    keywords: ['לקנות', 'קניות', 'סופר', 'חלב', 'לחם', 'תרופות', 'בית מרקחת', 'דואר', 'סידור', 'להזמין'],
  },
  {
    id: 'legal',
    label: 'משפטי / בירוקרטיה',
    inflected: 'למשפטי',
    emoji: '📑',
    color: '#64748B',
    keywords: ['עורך דין', 'חוזה', 'משפטי', 'בירוקרטיה', 'טופס', 'משרד הפנים', 'ביטוח לאומי', 'רשיון', 'אישור', 'תעודה'],
  },
  {
    id: 'inbox',
    label: 'תיבת נכנסים',
    inflected: 'לתיבה',
    emoji: '📥',
    color: '#94A3B8',
    keywords: [],
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

export function getCategory(id: CategoryId): CategoryMeta {
  return CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID.inbox;
}
