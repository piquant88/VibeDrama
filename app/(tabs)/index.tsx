import { useMemo, useState } from 'react';
import { View } from 'react-native';
import UnlockSheet from '../../components/UnlockSheet';
import VerticalPlayer from '../../components/VerticalPlayer';
import { useCatalog } from '../../lib/catalog';
import { Episode, Series } from '../../lib/data';

type Item = { series: Series; episode: Episode };

export default function ForYouScreen() {
  const catalog = useCatalog();
  // Mixed feed: first episodes of every series, in rotation, like a "for you" discovery feed.
  const items = useMemo<Item[]>(() => {
    const result: Item[] = [];
    catalog.forEach((series) => {
      series.episodes.slice(0, 3).forEach((episode) => {
        result.push({ series, episode });
      });
    });
    return result;
  }, [catalog]);

  const [unlockTarget, setUnlockTarget] = useState<Item | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <VerticalPlayer items={items} onUnlockRequest={(item) => setUnlockTarget(item)} />
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
