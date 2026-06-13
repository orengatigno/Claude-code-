import { CATEGORIES } from '@/constants/categories';
import { CategoryId } from '@/types';

export interface CategorizationResult {
  category: CategoryId;
  confidence: number; // 0..1
}

/**
 * Keyword-based categorizer used by the mock pipeline (and as a fallback if the
 * real AI returns an unknown category). Scores the text against each category's
 * keyword list and picks the best match; defaults to the General Inbox.
 */
export function categorizeByKeywords(text: string): CategorizationResult {
  const normalized = text.toLowerCase();
  let best: { id: CategoryId; hits: number } = { id: 'inbox', hits: 0 };

  for (const cat of CATEGORIES) {
    if (cat.id === 'inbox') continue;
    let hits = 0;
    for (const kw of cat.keywords) {
      if (normalized.includes(kw.toLowerCase())) hits += 1;
    }
    // Person categories (named children) are strong signals — weight them up.
    if (hits > 0 && ['ilay', 'ella', 'isabelle'].includes(cat.id)) {
      hits += 1;
    }
    if (hits > best.hits) {
      best = { id: cat.id, hits };
    }
  }

  if (best.hits === 0) {
    return { category: 'inbox', confidence: 0.3 };
  }

  // Rough confidence: more keyword hits -> higher confidence, capped at 0.95.
  const confidence = Math.min(0.5 + best.hits * 0.2, 0.95);
  return { category: best.id, confidence };
}
