import { useCallback, useState } from 'react';
import { api } from '@/lib/api-client';

export type LikeKind = 'short-posts' | 'reels';

const keyFor = (kind: LikeKind) => `mibnews-liked-${kind}`;

function readLiked(kind: LikeKind): Set<string> {
  try {
    const raw = localStorage.getItem(keyFor(kind));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeLiked(kind: LikeKind, set: Set<string>) {
  try {
    localStorage.setItem(keyFor(kind), JSON.stringify([...set]));
  } catch {}
}

export function isLoggedIn(): boolean {
  try {
    return !!(
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      JSON.parse(localStorage.getItem('user') || '{}')?.token
    );
  } catch {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }
}

/**
 * Single-like toggle with red-fill state.
 * - Requires login (returns {ok:false, reason:'login'} so callers can redirect/toast)
 * - Uses authed api-client (sends Bearer token), NOT raw fetch
 * - Server is source of truth: {likes, liked}; localStorage persists across refresh
 */
export function useLikes(kind: LikeKind) {
  const [likedIds, setLikedIds] = useState<Set<string>>(() => readLiked(kind));
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const isLiked = useCallback((id: string, serverFlag?: boolean) => {
    if (typeof serverFlag === 'boolean' && serverFlag) return true;
    return likedIds.has(id);
  }, [likedIds]);

  const seedFromServer = useCallback((items: Array<{ _id: string; isLiked?: boolean }>) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const it of items || []) {
        if (it?.isLiked && !next.has(it._id)) { next.add(it._id); changed = true; }
      }
      if (changed) writeLiked(kind, next);
      return changed ? next : prev;
    });
  }, [kind]);

  const toggleLike = useCallback(async (
    id: string,
    currentLikes: number
  ): Promise<{ ok: boolean; likes: number; liked: boolean; reason?: string }> => {
    if (!isLoggedIn()) {
      return { ok: false, likes: currentLikes, liked: false, reason: 'login' };
    }
    if (pendingIds.has(id)) {
      return { ok: false, likes: currentLikes, liked: likedIds.has(id), reason: 'pending' };
    }
    setPendingIds((p) => new Set(p).add(id));
    try {
      const res = await api.post<{ likes: number; liked: boolean }>(`/${kind}/${id}/like`);
      if (res.success && res.data) {
        const { likes, liked } = res.data as { likes: number; liked: boolean };
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (liked) next.add(id); else next.delete(id);
          writeLiked(kind, next);
          return next;
        });
        return { ok: true, likes, liked };
      }
      return { ok: false, likes: currentLikes, liked: likedIds.has(id), reason: 'server' };
    } catch {
      return { ok: false, likes: currentLikes, liked: likedIds.has(id), reason: 'network' };
    } finally {
      setPendingIds((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  }, [kind, likedIds, pendingIds]);

  return { isLiked, toggleLike, seedFromServer, likedIds, pendingIds };
}
