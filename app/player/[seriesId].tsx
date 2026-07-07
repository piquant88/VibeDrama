import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import UnlockSheet from '../../components/UnlockSheet';
import VerticalPlayer from '../../components/VerticalPlayer';
import { useCatalog } from '../../lib/catalog';
import { Episode, Series } from '../../lib/data';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

type Item = { series: Series; episode: Episode };

export default function PlayerScreen() {
  const { seriesId, episode } = useLocalSearchParams<{ seriesId: string; episode?: string }>();
  const router = useRouter();
  const catalog = useCatalog();
  const series = catalog.find((s) => s.id === seriesId);
  const { autoUnlock, coins, unlockEpisode, isEpisodeUnlocked } = useApp();
  const [unlockTarget, setUnlockTarget] = useState<Item | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [startIndex, setStartIndex] = useState<number | null>(null);

  const items = useMemo<Item[]>(() => {
    if (!series) return [];
    return series.episodes.map((episode) => ({ series, episode }));
  }, [series]);

  const initialIndex = useMemo(() => {
    if (startIndex != null) return startIndex;
    if (!episode) return 0;
    const idx = items.findIndex((it) => it.episode.index === Number(episode));
    return idx >= 0 ? idx : 0;
  }, [episode, items, startIndex]);

  // DramaBox-style auto-unlock: landing on a locked episode spends coins
  // automatically when the user has opted in and can afford it.
  const handleActiveItem = useCallback(
    (item: Item) => {
      const locked = !isEpisodeUnlocked(item.series.id, item.episode.index, item.episode.id);
      if (locked && autoUnlock && coins >= item.series.coinsPerEpisode) {
        unlockEpisode(item.series.id, item.episode.id, item.series.coinsPerEpisode);
      }
    },
    [autoUnlock, coins, unlockEpisode, isEpisodeUnlocked]
  );

  if (!series) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VerticalPlayer
        key={playerKey}
        items={items}
        initialIndex={initialIndex}
        onUnlockRequest={(item) => setUnlockTarget(item)}
        onActiveItemChange={handleActiveItem}
      />

      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </Pressable>

      <Pressable style={styles.drawerBtn} onPress={() => setDrawerOpen(true)} hitSlop={12}>
        <Ionicons name="grid-outline" size={20} color="#fff" />
        <Text style={styles.drawerBtnText}>EP</Text>
      </Pressable>

      {/* Episode grid drawer */}
      <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
        <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>{series.title}</Text>
            <Text style={styles.drawerSub}>
              {series.episodes.length} episodes · first {series.freeEpisodeCount} free
            </Text>
            <FlatList
              data={series.episodes}
              keyExtractor={(e) => e.id}
              numColumns={5}
              contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
              columnWrapperStyle={{ gap: 10 }}
              renderItem={({ item, index }) => {
                const locked = !isEpisodeUnlocked(series.id, item.index, item.id);
                return (
                  <Pressable
                    style={[styles.epCell, locked && styles.epCellLocked]}
                    onPress={() => {
                      setDrawerOpen(false);
                      setStartIndex(index);
                      setPlayerKey((k) => k + 1); // remount player at the chosen episode
                    }}
                  >
                    {locked && (
                      <Ionicons name="lock-closed" size={11} color={colors.textMuted} style={{ marginBottom: 2 }} />
                    )}
                    <Text style={[styles.epNumber, locked && { color: colors.textMuted }]}>{item.index}</Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBtn: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  drawerBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  drawerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '65%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  drawerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  epCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epCellLocked: { backgroundColor: colors.bg },
  epNumber: { color: colors.text, fontWeight: '700' },
});
