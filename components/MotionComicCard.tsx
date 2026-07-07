import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Episode, Scene, Series } from '../lib/data';
import { colors } from '../lib/theme';
import SeekBar from './SeekBar';

const { width, height } = Dimensions.get('window');

const SPEEDS = [1, 1.25, 1.5, 2];

export default function MotionComicCard({
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
  const scenes: Scene[] = episode.scenes ?? [];
  const [sceneIndex, setSceneIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;

  const rate = SPEEDS[speedIdx];
  const scene = scenes[Math.min(sceneIndex, scenes.length - 1)];
  const playing = active && !locked && !paused;
  const sceneMs = scene ? (scene.durationSec * 1000) / rate : 0;

  const audioPlayer = useAudioPlayer(playing && scene?.audio ? { uri: scene.audio } : null);

  useEffect(() => {
    if (playing && scene?.audio) {
      audioPlayer.setPlaybackRate(rate);
      audioPlayer.play();
    }
  }, [playing, scene?.audio, audioPlayer, rate]);

  // Reset to scene 1 whenever this episode becomes the active page.
  useEffect(() => {
    if (active) setSceneIndex(0);
  }, [active]);

  // Ken Burns zoom per scene.
  useEffect(() => {
    if (!playing || !scene) return;
    scale.setValue(1);
    const anim = Animated.timing(scale, {
      toValue: 1.12,
      duration: sceneMs,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [playing, sceneIndex, scene, scale, sceneMs]);

  // Scene advance timer.
  useEffect(() => {
    if (!playing || !scene) return;
    const t = setTimeout(() => {
      if (sceneIndex < scenes.length - 1) {
        setSceneIndex((i) => i + 1);
      } else {
        onNextEpisode();
      }
    }, sceneMs);
    return () => clearTimeout(t);
  }, [playing, sceneIndex, scene, scenes.length, onNextEpisode, sceneMs]);

  if (!scene) return <View style={styles.container} />;

  const totalSec = scenes.reduce((sum, s) => sum + s.durationSec, 0);
  const elapsedSec = scenes.slice(0, sceneIndex).reduce((sum, s) => sum + s.durationSec, 0);

  return (
    <View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((p) => !p)}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
          <Image source={{ uri: scene.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </Animated.View>
      </Pressable>

      {!locked && paused && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <Ionicons name="play" size={64} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Tappable scene dots */}
      <View style={styles.progressRow}>
        {scenes.map((_, i) => (
          <Pressable key={i} onPress={() => setSceneIndex(i)} hitSlop={8}>
            <View style={[styles.dot, i === sceneIndex && styles.dotActive]} />
          </Pressable>
        ))}
      </View>

      {!locked && (
        <Pressable
          style={styles.speedBtn}
          onPress={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
          hitSlop={10}
        >
          <Text style={styles.speedText}>{rate}x</Text>
        </Pressable>
      )}

      <View style={styles.bottomInfo} pointerEvents="none">
        <Text style={styles.seriesTitle}>{series.title}</Text>
        <Text style={styles.episodeTitle}>
          EP {episode.index} · {episode.title}
        </Text>
        <Text style={styles.caption}>{scene.caption}</Text>
      </View>

      {!locked && (
        <View style={styles.seekRow}>
          <SeekBar
            progress={totalSec > 0 ? elapsedSec / totalSec : 0}
            currentSec={elapsedSec}
            totalSec={totalSec}
            onSeek={(ratio) => {
              const idx = Math.min(scenes.length - 1, Math.floor(ratio * scenes.length));
              setSceneIndex(idx);
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
  },
  progressRow: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 60,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  dot: { width: 24, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff' },
  speedBtn: {
    position: 'absolute',
    top: 52,
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
    right: 16,
    bottom: 150,
  },
  seriesTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  episodeTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 10 },
  caption: { color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22 },
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
