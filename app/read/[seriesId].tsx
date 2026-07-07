import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UnlockSheet from '../../components/UnlockSheet';
import { useCatalog } from '../../lib/catalog';
import { Episode } from '../../lib/data';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

/** Novel-style text of one episode: narration lines joined as prose. */
function episodeText(ep: Episode): string {
  if (!ep.scenes) return '';
  return ep.scenes
    .map((s) => s.narration ?? s.caption)
    .filter(Boolean)
    .join('\n\n');
}

export default function ReadScreen() {
  const { seriesId, episode } = useLocalSearchParams<{ seriesId: string; episode?: string }>();
  const router = useRouter();
  const catalog = useCatalog();
  const { isEpisodeUnlocked } = useApp();
  const series = catalog.find((s) => s.id === seriesId);
  const [epIndex, setEpIndex] = useState(() => Math.max(0, (Number(episode) || 1) - 1));
  const [unlockOpen, setUnlockOpen] = useState(false);

  const readable = useMemo(
    () => (series?.episodes ?? []).filter((e) => e.scenes && e.scenes.length > 0),
    [series]
  );

  if (!series || readable.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 16 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.emptyText}>Read mode is available for AI dramas only.</Text>
      </SafeAreaView>
    );
  }

  const ep = readable[Math.min(epIndex, readable.length - 1)];
  const locked = !isEpisodeUnlocked(series.id, ep.index, ep.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {series.title}
        </Text>
        <Pressable
          onPress={() => router.push(`/player/${series.id}?episode=${ep.index}`)}
          hitSlop={12}
        >
          <Ionicons name="play-circle" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.chapterLabel}>CHAPTER {ep.index}</Text>
        <Text style={styles.chapterTitle}>{ep.title}</Text>

        {locked ? (
          <View style={styles.lockBox}>
            <Ionicons name="lock-closed" size={34} color={colors.accent} />
            <Text style={styles.lockText}>This chapter is locked</Text>
            <Pressable style={styles.unlockBtn} onPress={() => setUnlockOpen(true)}>
              <Ionicons name="diamond" size={15} color="#1A1A1A" />
              <Text style={styles.unlockBtnText}>Unlock for {series.coinsPerEpisode} coins</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.body}>{episodeText(ep)}</Text>
        )}
      </ScrollView>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.navBtn, epIndex === 0 && styles.navBtnDisabled]}
          disabled={epIndex === 0}
          onPress={() => setEpIndex((i) => i - 1)}
        >
          <Ionicons name="chevron-back" size={16} color={colors.text} />
          <Text style={styles.navText}>Previous</Text>
        </Pressable>
        <Text style={styles.navPos}>
          {Math.min(epIndex + 1, readable.length)} / {readable.length}
        </Text>
        <Pressable
          style={[styles.navBtn, epIndex >= readable.length - 1 && styles.navBtnDisabled]}
          disabled={epIndex >= readable.length - 1}
          onPress={() => setEpIndex((i) => i + 1)}
        >
          <Text style={styles.navText}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text} />
        </Pressable>
      </View>

      <UnlockSheet
        visible={unlockOpen}
        series={series}
        episode={ep}
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => setUnlockOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  chapterLabel: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  chapterTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 18 },
  body: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 30 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, paddingHorizontal: 40 },
  lockBox: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  lockText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  unlockBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: 13 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navBtnDisabled: { opacity: 0.35 },
  navText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  navPos: { color: colors.textMuted, fontSize: 13 },
});
