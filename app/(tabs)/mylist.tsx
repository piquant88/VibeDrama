import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '../../lib/catalog';
import { Series } from '../../lib/data';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function MyListScreen() {
  const catalog = useCatalog();
  const router = useRouter();
  const { favorites, watchProgress, toggleFavorite } = useApp();

  const favoriteSeries = useMemo(
    () => catalog.filter((s) => favorites.includes(s.id)),
    [catalog, favorites]
  );
  const continueWatching = useMemo(
    () =>
      catalog
        .filter((s) => (watchProgress[s.id] ?? 0) > 0)
        .sort((a, b) => (watchProgress[b.id] ?? 0) - (watchProgress[a.id] ?? 0)),
    [catalog, watchProgress]
  );

  const renderRow = (item: Series, subtitle: string, showRemove: boolean) => (
    <Pressable style={styles.row} onPress={() => router.push(`/series/${item.id}`)}>
      <Image source={{ uri: item.cover }} style={styles.rowCover} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {showRemove ? (
        <Pressable onPress={() => toggleFavorite(item.id)} hitSlop={10}>
          <Ionicons name="heart" size={22} color={colors.primary} />
        </Pressable>
      ) : (
        <Pressable
          style={styles.resumeBtn}
          onPress={() => router.push(`/player/${item.id}?episode=${watchProgress[item.id] ?? 1}`)}
        >
          <Ionicons name="play" size={14} color="#1A1A1A" />
        </Pressable>
      )}
    </Pressable>
  );

  const empty = favoriteSeries.length === 0 && continueWatching.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Text style={styles.header}>My List</Text>

        {empty && (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Series you save and shows you're watching will appear here.
            </Text>
            <Pressable style={styles.browseBtn} onPress={() => router.push('/home')}>
              <Text style={styles.browseText}>Browse dramas</Text>
            </Pressable>
          </View>
        )}

        {continueWatching.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            {continueWatching.map((s) => (
              <View key={s.id}>
                {renderRow(s, `EP ${watchProgress[s.id]} of ${s.episodes.length}`, false)}
              </View>
            ))}
          </>
        )}

        {favoriteSeries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Saved</Text>
            {favoriteSeries.map((s) => (
              <View key={s.id}>{renderRow(s, `${s.genre} · ${s.episodes.length} episodes`, true)}</View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 14, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 10,
    marginVertical: 4,
  },
  rowCover: { width: 52, height: 74, borderRadius: 8, backgroundColor: colors.surface },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  rowSub: { color: colors.textMuted, fontSize: 12 },
  resumeBtn: {
    backgroundColor: colors.accent,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingHorizontal: 30, fontSize: 14 },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseText: { color: '#fff', fontWeight: '700' },
});
