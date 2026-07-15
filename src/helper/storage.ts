/**
 * Safe localStorage helper
 */

export const STORAGE_KEYS = {
  TOKEN:            'auth_token',
  USER:             'user',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  RATED_SESSIONS:   'rated_sessions',
} as const;

export const storage = {
  // Generic methods
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  },

  // Auth specific methods
  getToken: (): string | null => {
    return storage.get(STORAGE_KEYS.TOKEN, null);
  },

  setToken: (token: string): void => {
    storage.set(STORAGE_KEYS.TOKEN, token);
  },

  getUser: <T>(): T | null => {
    return storage.get(STORAGE_KEYS.USER, null);
  },

  setUser: <T>(user: T): void => {
    storage.set(STORAGE_KEYS.USER, user);
  },

  getTokenExpiresAt: (): number | null => {
    return storage.get<number | null>(STORAGE_KEYS.TOKEN_EXPIRES_AT, null);
  },

  setTokenExpiresAt: (ts: number): void => {
    storage.set(STORAGE_KEYS.TOKEN_EXPIRES_AT, ts);
  },

  clearAuth: (): void => {
    storage.remove(STORAGE_KEYS.TOKEN);
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  },

  // Rating CSAT: session đã "resolved" (đã rate hoặc đã bỏ qua) — không hỏi lại
  hasResolvedRating: (sessionId: string): boolean => {
    return storage.get<string[]>(STORAGE_KEYS.RATED_SESSIONS, []).includes(sessionId);
  },

  markRatingResolved: (sessionId: string): void => {
    const list = storage.get<string[]>(STORAGE_KEYS.RATED_SESSIONS, []);
    if (!list.includes(sessionId)) storage.set(STORAGE_KEYS.RATED_SESSIONS, [...list, sessionId]);
  },
};