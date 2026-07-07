import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import UnlockSheet from '../../components/UnlockSheet';
import VerticalPlayer from '../../components/VerticalPlayer';
import { useCatalog } from '../../lib/catalog';
import { Episode, Series } from '../../lib/data';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

type Item = { series: Series; episode: Episode };

export default function ForYouScreen() {
  const catalog = useCatalog();
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useApp();

  // DramaBox-style discovery feed: each swipe is a NEW SERIES (its first
  // episode as a preview). Watching the rest happens in the series player.
  const items = useMemo<Item[]>(
    () =>
      catalog
        .filter((s) => s.episodes.length > 0)
        .map((series) => ({ series, episode: series.episodes[0] })),
    [catalog]
  );

  const [unlockTarget, setUnlockTarget] = useState<Item | null>(null);
  const [activeSeries, setActiveSeries] = useState<Series | null>(items[0]?.series ?? null);
  const current = activeSeries ?? items[0]?.series ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VerticalPlayer
        items={items}
        onUnlockRequest={(item) => setUnlockTarget(item)}
        onActiveItemChange={(item) => setActiveSeries(item.series)}
      />

      {current && (
        <View style={styles.sideActions}>
          <Pressable style={styles.sideBtn} onPress={() => toggleFavorite(current.id)} hitSlop={8}>
            <Ionicons
              name={isFavorite(current.id) ? 'heart' : 'heart-outline'}
              size={30}
              color={isFavorite(current.id) ? colors.primary : '#fff'}
            />
            <Text style={styles.sideLabel}>{isFavorite(current.id) ? 'Saved' : 'Save'}</Text>
          </Pressable>
          <Pressable
            style={styles.sideBtn}
            onPress={() => router.push(`/series/${current.id}`)}
            hitSlop={8}
          >
            <Ionicons name="albums-outline" size={28} color="#fff" />
            <Text style={styles.sideLabel}>Episodes</Text>
          </Pressable>
        </View>
      )}

      {current && (
        <Pressable
          style={styles.watchFullBtn}
          onPress={() => router.push(`/player/${current.id}?episode=1`)}
        >
          <Ionicons name="play" size={16} color="#1A1A1A" />
          <Text style={styles.watchFullText}>Watch full series ({current.episodes.length} EP)</Text>
          <Ionicons name="chevron-forward" size={16} color="#1A1A1A" />
        </Pressable>
      )}

      <UnlockSheet
        visible={!!unlockTarget}
        series={unlockTarget?.series ?? null}
        episode={unlockTarget?.episode ?? null}
        onClose={() => setUnlockTarget(null)}
        onUnlocked={() => setUnlockTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sideActions: {
    position: 'absolute',
    right: 12,
    bottom: 200,
    alignItems: 'center',
    gap: 20,
  },
  sideBtn: { alignItems: 'center', gap: 2 },
  sideLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
  watchFullBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    borderRadius: 26,
  },
  watchFullText: { color: '#1A1A1A', fontWeight: '800', fontSize: 14 },
});
