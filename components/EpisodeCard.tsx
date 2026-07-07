import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Episode, Series } from '../lib/data';
import { colors } from '../lib/theme';

const { width, height } = Dimensions.get('window');

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
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [paused, setPaused] = useState(false);

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
    const sub = player.addListener('playToEnd', () => {
      onNextEpisode();
    });
    return () => sub.remove();
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

      {!locked && paused && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <Ionicons name="play" size={64} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.bottomInfo} pointerEvents="none">
        <Text style={styles.seriesTitle}>{series.title}</Text>
        <Text style={styles.episodeTitle}>
          EP {episode.index} · {episode.title}
        </Text>
      </View>

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

const styles = StyleSheet.create({
  container: { width, height, backgroundColor: '#000' },
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 90,
    bottom: 110,
  },
  seriesTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  episodeTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
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
