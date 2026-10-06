import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useFormDraft — persist form state to localStorage so a refresh doesn't wipe
 * what the user typed. Files can't be restored (browser security), but all
 * text/select/switch state survives.
 *
 * @param key unique storage key, e.g. `draft:video:new` or `draft:liveTv:edit:<id>`
 * @param initial initial state (used when no draft exists)
 * @param options.enabled set false to disable (e.g. edit mode with server data loading)
 * @param options.debounceMs delay before persisting (default 500)
 *
 * Returns [value, setValue, {clear, hasDraft, restored}]
 */
export function useFormDraft<T extends Record<string, any>>(
  key: string,
  initial: T,
  options: { enabled?: boolean; debounceMs?: number } = {}
): [T, React.Dispatch<React.SetStateAction<T>>, { clear: () => void; hasDraft: boolean }] {
  const { enabled = true, debounceMs = 500 } = options;
  const [hasDraft, setHasDraft] = useState(false);
  const restoredRef = useRef(false);

  const [value, setValue] = useState<T>(() => {
    if (!enabled) return initial;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          restoredRef.current = true;
          return { ...initial, ...parsed };
        }
      }
    } catch {}
    return initial;
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark hasDraft after mount if a stored draft was restored
  useEffect(() => {
    if (restoredRef.current) setHasDraft(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change (debounced)
  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        // Don't persist empty drafts (everything blank/false)
        const entries = Object.entries(value || {});
        const meaningful = entries.some(([k, v]) => {
          if (k === '_restored') return false;
          if (typeof v === 'string') return v.trim() !== '';
          if (Array.isArray(v)) return v.length > 0;
          if (typeof v === 'boolean') return v === true;
          return v !== null && v !== undefined && v !== 0;
        });
        if (meaningful) {
          localStorage.setItem(key, JSON.stringify(value));
          setHasDraft(true);
        }
      } catch {}
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, value, enabled, debounceMs]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setHasDraft(false);
  }, [key]);

  return [value, setValue, { clear, hasDraft }];
}

/** Remove all drafts for a given prefix (e.g. after publish). */
export function clearDrafts(prefix: string) {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
