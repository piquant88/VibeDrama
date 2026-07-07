import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { findSeries } from './catalog';

type User = {
  name: string;
  email: string;
};

type AppState = {
  user: User | null;
  coins: number;
  unlockedEpisodeIds: string[];
  watchProgress: Record<string, number>; // seriesId -> last episode index watched
  favorites: string[]; // seriesIds
  lastCheckIn: string | null; // YYYY-MM-DD
  checkInStreak: number;
  autoUnlock: boolean; // spend coins automatically when hitting a locked episode
  hydrated: boolean;
};

type AppContextValue = AppState & {
  signIn: (name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  unlockEpisode: (seriesId: string, episodeId: string, cost: number) => boolean;
  isEpisodeUnlocked: (seriesId: string, episodeIndex: number, episodeId: string) => boolean;
  setWatchProgress: (seriesId: string, episodeIndex: number) => void;
  toggleFavorite: (seriesId: string) => void;
  isFavorite: (seriesId: string) => boolean;
  /** Claims today's check-in. Returns coins earned, or 0 if already claimed today. */
  dailyCheckIn: () => number;
  canCheckInToday: () => boolean;
  setAutoUnlock: (on: boolean) => void;
};

const STORAGE_KEY = 'vibedrama:state:v1';

/** Check-in rewards by streak day (1-based, capped at day 7). */
export const CHECK_IN_REWARDS = [10, 15, 20, 25, 30, 40, 50];

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_STATE: AppState = {
  user: null,
  coins: 100,
  unlockedEpisodeIds: [],
  watchProgress: {},
  favorites: [],
  lastCheckIn: null,
  checkInStreak: 0,
  autoUnlock: false,
  hydrated: false,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState({ ...DEFAULT_STATE, ...parsed, hydrated: true });
        } else {
          setState((s) => ({ ...s, hydrated: true }));
        }
      } catch {
        setState((s) => ({ ...s, hydrated: true }));
      }
    })();
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    const { hydrated, ...toSave } = next;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, []);

  const signIn = useCallback(
    async (name: string, email: string) => {
      persist({ ...state, user: { name, email } });
    },
    [state, persist]
  );

  const signOut = useCallback(async () => {
    persist({ ...state, user: null });
  }, [state, persist]);

  const addCoins = useCallback(
    async (amount: number) => {
      persist({ ...state, coins: state.coins + amount });
    },
    [state, persist]
  );

  const unlockEpisode = useCallback(
    (seriesId: string, episodeId: string, cost: number) => {
      if (state.unlockedEpisodeIds.includes(episodeId)) return true;
      if (state.coins < cost) return false;
      persist({
        ...state,
        coins: state.coins - cost,
        unlockedEpisodeIds: [...state.unlockedEpisodeIds, episodeId],
      });
      return true;
    },
    [state, persist]
  );

  const isEpisodeUnlocked = useCallback(
    (seriesId: string, episodeIndex: number, episodeId: string) => {
      const series = findSeries(seriesId);
      if (series && episodeIndex <= series.freeEpisodeCount) return true;
      return state.unlockedEpisodeIds.includes(episodeId);
    },
    [state.unlockedEpisodeIds]
  );

  const setWatchProgress = useCallback(
    (seriesId: string, episodeIndex: number) => {
      const current = state.watchProgress[seriesId] ?? 0;
      if (episodeIndex <= current) return;
      persist({
        ...state,
        watchProgress: { ...state.watchProgress, [seriesId]: episodeIndex },
      });
    },
    [state, persist]
  );

  const toggleFavorite = useCallback(
    (seriesId: string) => {
      persist({
        ...state,
        favorites: state.favorites.includes(seriesId)
          ? state.favorites.filter((id) => id !== seriesId)
          : [...state.favorites, seriesId],
      });
    },
    [state, persist]
  );

  const isFavorite = useCallback(
    (seriesId: string) => state.favorites.includes(seriesId),
    [state.favorites]
  );

  const canCheckInToday = useCallback(() => state.lastCheckIn !== todayStr(), [state.lastCheckIn]);

  const dailyCheckIn = useCallback(() => {
    if (state.lastCheckIn === todayStr()) return 0;
    const streak = state.lastCheckIn === yesterdayStr() ? state.checkInStreak + 1 : 1;
    const reward = CHECK_IN_REWARDS[Math.min(streak, CHECK_IN_REWARDS.length) - 1];
    persist({
      ...state,
      coins: state.coins + reward,
      lastCheckIn: todayStr(),
      checkInStreak: streak,
    });
    return reward;
  }, [state, persist]);

  const setAutoUnlock = useCallback(
    (on: boolean) => {
      persist({ ...state, autoUnlock: on });
    },
    [state, persist]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      addCoins,
      unlockEpisode,
      isEpisodeUnlocked,
      setWatchProgress,
      toggleFavorite,
      isFavorite,
      dailyCheckIn,
      canCheckInToday,
      setAutoUnlock,
    }),
    [
      state,
      signIn,
      signOut,
      addCoins,
      unlockEpisode,
      isEpisodeUnlocked,
      setWatchProgress,
      toggleFavorite,
      isFavorite,
      dailyCheckIn,
      canCheckInToday,
      setAutoUnlock,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
