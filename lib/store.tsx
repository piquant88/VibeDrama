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
  hydrated: boolean;
};

type AppContextValue = AppState & {
  signIn: (name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  unlockEpisode: (seriesId: string, episodeId: string, cost: number) => boolean;
  isEpisodeUnlocked: (seriesId: string, episodeIndex: number, episodeId: string) => boolean;
  setWatchProgress: (seriesId: string, episodeIndex: number) => void;
};

const STORAGE_KEY = 'vibedrama:state:v1';

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_STATE: AppState = {
  user: null,
  coins: 100,
  unlockedEpisodeIds: [],
  watchProgress: {},
  hydrated: false,
};

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

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      addCoins,
      unlockEpisode,
      isEpisodeUnlocked,
      setWatchProgress,
    }),
    [state, signIn, signOut, addCoins, unlockEpisode, isEpisodeUnlocked, setWatchProgress]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
