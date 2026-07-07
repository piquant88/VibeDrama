import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Draggable progress bar: tap or drag anywhere on it to jump.
 * `progress` is 0..1; `onSeek` receives the target ratio 0..1.
 */
export default function SeekBar({
  progress,
  currentSec,
  totalSec,
  onSeek,
}: {
  progress: number;
  currentSec: number;
  totalSec: number;
  onSeek: (ratio: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const trackWidthRef = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const r = clamp(evt.nativeEvent.locationX / trackWidthRef.current);
        setDragRatio(r);
      },
      onPanResponderMove: (evt) => {
        const r = clamp(evt.nativeEvent.locationX / trackWidthRef.current);
        setDragRatio(r);
      },
      onPanResponderRelease: (evt) => {
        const r = clamp(evt.nativeEvent.locationX / trackWidthRef.current);
        setDragRatio(null);
        onSeek(r);
      },
      onPanResponderTerminate: () => setDragRatio(null),
    })
  ).current;

  const shown = dragRatio ?? clamp(progress);

  return (
    <View>
      <View
        style={styles.touchArea}
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width);
          trackWidthRef.current = e.nativeEvent.layout.width;
        }}
        {...pan.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: shown * trackWidth }]} />
          <View style={[styles.thumb, { left: Math.max(0, shown * trackWidth - 6) }]} />
        </View>
      </View>
      <View style={styles.timeRow} pointerEvents="none">
        <Text style={styles.time}>{fmt(dragRatio != null ? dragRatio * totalSec : currentSec)}</Text>
        <Text style={styles.time}>{fmt(totalSec)}</Text>
      </View>
    </View>
  );
}

function clamp(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

const styles = StyleSheet.create({
  touchArea: { paddingVertical: 12, justifyContent: 'center' },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
});
