import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Episode, SERIES, Series } from './data';

// Base URL where the generated content/ folder is hosted, e.g.
// https://raw.githubusercontent.com/<user>/<repo>/main/content
const CONTENT_BASE_URL: string | undefined = Constants.expoConfig?.extra?.contentBaseUrl;

const CACHE_KEY = 'vibedrama:catalog:v1';

type RemoteScene = { image: string; audio?: string; caption: string; durationSec: number };
type RemoteEpisode = { id: string; index: number; title: string; scenes: RemoteScene[] };
type RemoteSeries = {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  cover: string;
  freeEpisodeCount: number;
  coinsPerEpisode: number;
  episodes: RemoteEpisode[];
};
type RemoteCatalog = { version: number; updatedAt: string; series: RemoteSeries[] };

function resolveUrl(rel: string): string {
  if (/^https?:\/\//.test(rel)) return rel;
  return `${CONTENT_BASE_URL}/${rel}`;
}

function toSeries(remote: RemoteSeries): Series {
  return {
    id: remote.id,
    title: remote.title,
    tagline: remote.tagline,
    genre: remote.genre,
    cover: resolveUrl(remote.cover),
    freeEpisodeCount: remote.freeEpisodeCount,
    coinsPerEpisode: remote.coinsPerEpisode,
    episodes: remote.episodes.map(
      (e): Episode => ({
        id: e.id,
        index: e.index,
        title: e.title,
        scenes: e.scenes.map((s) => ({
          image: resolveUrl(s.image),
          audio: s.audio ? resolveUrl(s.audio) : undefined,
          caption: s.caption,
          durationSec: s.durationSec,
        })),
        durationSec: e.scenes.reduce((n, s) => n + s.durationSec, 0),
      })
    ),
  };
}

function mergeCatalog(remote: RemoteCatalog): Series[] {
  const remoteSeries = remote.series.filter((s) => s.episodes.length > 0).map(toSeries);
  const remoteIds = new Set(remoteSeries.map((s) => s.id));
  // AI-generated series first, bundled demo series after (dropping any id collisions).
  return [...remoteSeries, ...SERIES.filter((s) => !remoteIds.has(s.id))];
}

// Module-level snapshot so non-React helpers (store, screens) can look up synchronously.
let currentCatalog: Series[] = SERIES;

export function getCatalog(): Series[] {
  return currentCatalog;
}

export function findSeries(id: string): Series | undefined {
  return currentCatalog.find((s) => s.id === id);
}

export function findEpisode(seriesId: string, episodeId: string): Episode | undefined {
  return findSeries(seriesId)?.episodes.find((e) => e.id === episodeId);
}

const CatalogContext = createContext<Series[]>(SERIES);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [series, setSeries] = useState<Series[]>(SERIES);

  useEffect(() => {
    let cancelled = false;

    const apply = (remote: RemoteCatalog) => {
      if (cancelled) return;
      const merged = mergeCatalog(remote);
      currentCatalog = merged;
      setSeries(merged);
    };

    (async () => {
      // 1. Cached copy for instant startup.
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) apply(JSON.parse(raw));
      } catch {}

      // 2. Fresh fetch.
      if (!CONTENT_BASE_URL) return;
      try {
        const res = await fetch(`${CONTENT_BASE_URL}/catalog.json`, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!res.ok) return;
        const remote = (await res.json()) as RemoteCatalog;
        apply(remote);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote)).catch(() => {});
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <CatalogContext.Provider value={series}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Series[] {
  return useContext(CatalogContext);
}
