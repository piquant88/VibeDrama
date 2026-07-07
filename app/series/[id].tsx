import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '../../lib/catalog';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isEpisodeUnlocked, watchProgress, toggleFavorite, isFavorite } = useApp();
  const catalog = useCatalog();
  const series = catalog.find((s) => s.id === id);

  if (!series) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.text }}>Series not found.</Text>
      </SafeAreaView>
    );
  }

  const lastWatched = watchProgress[series.id] ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => toggleFavorite(series.id)} hitSlop={12}>
          <Ionicons
            name={isFavorite(series.id) ? 'heart' : 'heart-outline'}
            size={26}
            color={isFavorite(series.id) ? colors.primary : colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Image source={{ uri: series.cover }} style={styles.cover} />
        <View style={styles.heroInfo}>
          <Text style={styles.genre}>{series.genre}</Text>
          <Text style={styles.title}>{series.title}</Text>
          <Text style={styles.tagline}>{series.tagline}</Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.playBtn}
              onPress={() => router.push(`/player/${series.id}?episode=${Math.max(lastWatched, 1)}`)}
            >
              <Ionicons name="play" size={18} color="#1A1A1A" />
              <Text style={styles.playBtnText}>{lastWatched > 0 ? `Resume EP ${lastWatched}` : 'Start watching'}</Text>
            </Pressable>
            {series.episodes.some((e) => e.scenes && e.scenes.length > 0) && (
              <Pressable
                style={styles.readBtn}
                onPress={() => router.push(`/read/${series.id}?episode=${Math.max(lastWatched, 1)}`)}
              >
                <Ionicons name="book-outline" size={16} color={colors.text} />
                <Text style={styles.readBtnText}>Read</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={series.episodes}
        keyExtractor={(e) => e.id}
        numColumns={5}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => {
          const locked = !isEpisodeUnlocked(series.id, item.index, item.id);
          return (
            <Pressable
              style={[styles.epCell, locked && styles.epCellLocked]}
              onPress={() => router.push(`/player/${series.id}?episode=${item.index}`)}
            >
              {locked && <Ionicons name="lock-closed" size={12} color={colors.textMuted} style={{ marginBottom: 2 }} />}
              <Text style={[styles.epNumber, locked && { color: colors.textMuted }]}>{item.index}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  readBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  hero: { flexDirection: 'row', padding: 16, gap: 16 },
  cover: { width: 120, height: 180, borderRadius: 12, backgroundColor: colors.card },
  heroInfo: { flex: 1, gap: 6, justifyContent: 'center' },
  genre: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  tagline: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    alignSelf: 'flex-start',
  },
  playBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: 13 },
  epCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epCellLocked: { backgroundColor: colors.surface },
  epNumber: { color: colors.text, fontWeight: '700' },
});
