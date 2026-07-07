import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Series } from '../../lib/data';
import { useCatalog } from '../../lib/catalog';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

const { width } = Dimensions.get('window');

function Shelf({ title, series }: { title: string; series: Series[] }) {
  const router = useRouter();
  if (series.length === 0) return null;
  return (
    <View style={styles.shelf}>
      <Text style={styles.shelfTitle}>{title}</Text>
      <FlatList
        horizontal
        data={series}
        keyExtractor={(s) => s.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={styles.shelfCard} onPress={() => router.push(`/series/${item.id}`)}>
            <Image source={{ uri: item.cover }} style={styles.shelfCover} />
            <Text style={styles.shelfCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

export default function HomeScreen() {
  const catalog = useCatalog();
  const router = useRouter();
  const { watchProgress } = useApp();

  const banner = catalog[0];
  const aiSeries = useMemo(() => catalog.filter((s) => s.episodes.some((e) => e.scenes)), [catalog]);
  const continueWatching = useMemo(
    () => catalog.filter((s) => (watchProgress[s.id] ?? 0) > 0),
    [catalog, watchProgress]
  );
  const byGenre = useMemo(() => {
    const groups = new Map<string, Series[]>();
    for (const s of catalog) {
      groups.set(s.genre, [...(groups.get(s.genre) ?? []), s]);
    }
    return [...groups.entries()];
  }, [catalog]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.appTitle}>VibeDrama</Text>

        {banner && (
          <Pressable style={styles.banner} onPress={() => router.push(`/series/${banner.id}`)}>
            <Image source={{ uri: banner.cover }} style={styles.bannerImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.bannerGradient}
            />
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerGenre}>{banner.genre.toUpperCase()} · FEATURED</Text>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerTagline} numberOfLines={2}>
                {banner.tagline}
              </Text>
              <View style={styles.playBtn}>
                <Ionicons name="play" size={16} color="#1A1A1A" />
                <Text style={styles.playBtnText}>Watch now</Text>
              </View>
            </View>
          </Pressable>
        )}

        <Shelf title="Continue Watching" series={continueWatching} />
        <Shelf title="New AI Dramas" series={aiSeries} />
        <Shelf title="Trending" series={catalog} />
        {byGenre.map(([genre, list]) => (
          <Shelf key={genre} title={genre} series={list} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  appTitle: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    height: width * 1.05,
    backgroundColor: colors.card,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  bannerInfo: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 },
  bannerGenre: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  bannerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  bannerTagline: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 8,
  },
  playBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: 13 },
  shelf: { marginTop: 22 },
  shelfTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  shelfCard: { width: 110 },
  shelfCover: {
    width: 110,
    height: 165,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  shelfCardTitle: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 6 },
});
