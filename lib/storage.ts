/**
 * localStorage helpers for history (client-side only)
 */

export interface HistoryItem {
  id: string;
  createdAt: string;
  mode: 'notes' | 'letter';
  transcript: string;
  result: unknown;
  outputLanguage: string;
  letterType?: string;
}

const STORAGE_KEY = 'aawaz_history';
const MAX_ITEMS = 10;

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };

  const history = getHistory();
  const updated = [newItem, ...history].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // storage full or disabled
  }

  return newItem;
}

export function deleteFromHistory(id: string): void {
  const history = getHistory().filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
