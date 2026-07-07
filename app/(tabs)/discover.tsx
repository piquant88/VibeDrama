import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '../../lib/catalog';
import { colors } from '../../lib/theme';

export default function DiscoverScreen() {
  const router = useRouter();
  const catalog = useCatalog();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Discover Dramas</Text>
      <FlatList
        data={catalog}
        keyExtractor={(s) => s.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/series/${item.id}`)}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={styles.genrePill}>
              <Text style={styles.genreText}>{item.genre}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.episodeRow}>
                <Ionicons name="film" size={12} color={colors.textMuted} />
                <Text style={styles.episodeCount}>{item.episodes.length} episodes</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { color: colors.text, fontSize: 24, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8 },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 2 / 3, backgroundColor: colors.surface },
  genrePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  genreText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  cardInfo: { padding: 10, gap: 6 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  episodeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  episodeCount: { color: colors.textMuted, fontSize: 12 },
});
