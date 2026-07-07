import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Episode, Series } from '../lib/data';
import { colors } from '../lib/theme';
import SeekBar from './SeekBar';

const { width, height } = Dimensions.get('window');

const SPEEDS = [1, 1.25, 1.5, 2];

export default function EpisodeCard({
  series,
  episode,
  active,
  locked,
  onUnlock,
  onNextEpisode,
}: {
  series: Series;
  episode: Episode;
  active: boolean;
  locked: boolean;
  onUnlock: () => void;
  onNextEpisode: () => void;
}) {
  const player = useVideoPlayer(episode.videoUrl ?? null, (p) => {
    p.loop = false;
    p.muted = false;
    p.timeUpdateEventInterval = 0.5;
  });
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
    error: undefined,
  });
  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (locked) {
      player.pause();
      return;
    }
    if (active && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, locked, paused, player]);

  useEffect(() => {
    player.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx, player]);

  useEffect(() => {
    const end = player.addListener('playToEnd', () => onNextEpisode());
    const time = player.addListener('timeUpdate', ({ currentTime }) => {
      setCurrentTime(currentTime);
      if (player.duration > 0) setDuration(player.duration);
    });
    return () => {
      end.remove();
      time.remove();
    };
  }, [player, onNextEpisode]);

  return (
    <View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((p) => !p)}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      </Pressable>

      {!locked && active && status === 'loading' && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {!locked && status === 'error' && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Ionicons name="cloud-offline" size={40} color={colors.textMuted} />
          <Text style={styles.errorText}>Couldn't load this episode{error ? `\n${error.message}` : ''}</Text>
        </View>
      )}

      {!locked && paused && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Ionicons name="play" size={64} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {!locked && (
        <Pressable
          style={styles.speedBtn}
          onPress={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
          hitSlop={10}
        >
          <Text style={styles.speedText}>{SPEEDS[speedIdx]}x</Text>
        </Pressable>
      )}

      <View style={styles.bottomInfo} pointerEvents="none">
        <Text style={styles.seriesTitle}>{series.title}</Text>
        <Text style={styles.episodeTitle}>
          EP {episode.index} · {episode.title}
        </Text>
      </View>

      {!locked && (
        <View style={styles.seekRow}>
          <SeekBar
            progress={duration > 0 ? currentTime / duration : 0}
            currentSec={currentTime}
            totalSec={duration}
            onSeek={(ratio) => {
              if (duration > 0) player.currentTime = ratio * duration;
            }}
          />
        </View>
      )}

      {locked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={40} color={colors.accent} />
          <Text style={styles.lockText}>Episode {episode.index} is locked</Text>
          <Pressable style={styles.unlockBtn} onPress={onUnlock}>
            <Ionicons name="diamond" size={16} color="#1A1A1A" />
            <Text style={styles.unlockBtnText}>Unlock for {series.coinsPerEpisode} coins</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const absoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = StyleSheet.create({
  container: { width, height, backgroundColor: '#000' },
  centerOverlay: {
    ...absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  speedBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  speedText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 90,
    bottom: 130,
  },
  seriesTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  episodeTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  seekRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
  },
  lockOverlay: {
    ...absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  lockText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  unlockBtnText: { color: '#1A1A1A', fontWeight: '700' },
});
