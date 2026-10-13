export const DEFAULT_LEAD_CATEGORIES = [
  'AI Development Company',
  'Forward Deployed Engineering',
  'Blockchain Development Company',
  'Web3 Development Company',
  'Web3 Marketing Agency',
] as const;

export type DefaultLeadCategory = (typeof DEFAULT_LEAD_CATEGORIES)[number];

const STORAGE_KEY = 'digitechzo_crm_custom_categories';
export const CATEGORIES_UPDATED_EVENT = 'digitechzo_categories_updated';

/**
 * Get custom categories persisted in localStorage
 */
export const getCustomCategories = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (c) => typeof c === 'string' && c.trim().length > 0 && !DEFAULT_LEAD_CATEGORIES.includes(c as any)
        );
      }
    }
  } catch (err) {
    console.error('Failed to parse stored categories', err);
  }
  return [];
};

/**
 * Persist a newly added category and notify listeners
 */
export const addCustomCategory = (newCat: string): string[] => {
  const trimmed = newCat.trim();
  if (!trimmed) return getCustomCategories();

  // If already in predefined list, no need to store as custom
  const isPredefined = DEFAULT_LEAD_CATEGORIES.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (isPredefined) {
    return getCustomCategories();
  }

  const current = getCustomCategories();
  const exists = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const updated = [...current, trimmed];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(CATEGORIES_UPDATED_EVENT));
    } catch (err) {
      console.error('Failed to save category', err);
    }
    return updated;
  }
  return current;
};

/**
 * Get all available categories (predefined + custom + any from current records)
 */
export const getAllCategories = (extraCategories: (string | undefined | null)[] = []): string[] => {
  const custom = getCustomCategories();
  const validExtras = extraCategories
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .map((c) => c.trim());

  const combined = [...DEFAULT_LEAD_CATEGORIES, ...custom, ...validExtras];
  
  // Deduplicate case-insensitively while preserving original casing
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of combined) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }

  return result;
};
