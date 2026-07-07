import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import UnlockSheet from '../../components/UnlockSheet';
import VerticalPlayer from '../../components/VerticalPlayer';
import { useCatalog } from '../../lib/catalog';
import { Episode, Series } from '../../lib/data';
import { colors } from '../../lib/theme';

type Item = { series: Series; episode: Episode };

export default function PlayerScreen() {
  const { seriesId, episode } = useLocalSearchParams<{ seriesId: string; episode?: string }>();
  const router = useRouter();
  const catalog = useCatalog();
  const series = catalog.find((s) => s.id === seriesId);
  const [unlockTarget, setUnlockTarget] = useState<Item | null>(null);

  const items = useMemo<Item[]>(() => {
    if (!series) return [];
    return series.episodes.map((episode) => ({ series, episode }));
  }, [series]);

  const initialIndex = useMemo(() => {
    if (!episode) return 0;
    const idx = items.findIndex((it) => it.episode.index === Number(episode));
    return idx >= 0 ? idx : 0;
  }, [episode, items]);

  if (!series) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VerticalPlayer items={items} initialIndex={initialIndex} onUnlockRequest={(item) => setUnlockTarget(item)} />

      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </Pressable>

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
});
