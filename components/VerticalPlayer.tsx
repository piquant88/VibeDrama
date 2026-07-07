import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, View, ViewToken } from 'react-native';
import { Episode, Series } from '../lib/data';
import { useApp } from '../lib/store';
import EpisodeCard from './EpisodeCard';
import MotionComicCard from './MotionComicCard';

const { height } = Dimensions.get('window');

type Item = { series: Series; episode: Episode };

export default function VerticalPlayer({
  items,
  initialIndex = 0,
  onUnlockRequest,
}: {
  items: Item[];
  initialIndex?: number;
  onUnlockRequest: (item: Item) => void;
}) {
  const { isEpisodeUnlocked, setWatchProgress } = useApp();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const listRef = useRef<FlatList<Item>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setActiveIndex(idx);
      const item = items[idx];
      if (item) setWatchProgress(item.series.id, item.episode.index);
    }
  }).current;

  const goToNext = useCallback(
    (fromIndex: number) => {
      const next = fromIndex + 1;
      if (next < items.length) {
        listRef.current?.scrollToIndex({ index: next, animated: true });
      }
    },
    [items.length]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.episode.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item, index }) => {
          const locked = !isEpisodeUnlocked(item.series.id, item.episode.index, item.episode.id);
          const cardProps = {
            series: item.series,
            episode: item.episode,
            active: index === activeIndex,
            locked,
            onUnlock: () => onUnlockRequest(item),
            onNextEpisode: () => goToNext(index),
          };
          return item.episode.scenes ? (
            <MotionComicCard {...cardProps} />
          ) : (
            <EpisodeCard {...cardProps} />
          );
        }}
      />
    </View>
  );
}
