import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

const COIN_PACKS = [
  { coins: 100, price: '$0.99' },
  { coins: 550, price: '$4.99' },
  { coins: 1200, price: '$9.99' },
  { coins: 2600, price: '$19.99' },
];

export default function ProfileScreen() {
  const { user, coins, addCoins, signOut } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user ? user.name : 'Guest viewer'}</Text>
            <Text style={styles.email}>{user ? user.email : 'Sign in to save your progress'}</Text>
          </View>
          {!user && (
            <Pressable style={styles.signInBtn} onPress={() => router.push('/auth/login')}>
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.coinCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="diamond" size={22} color={colors.accent} />
            <Text style={styles.coinBalance}>{coins} coins</Text>
          </View>
          <Text style={styles.coinHint}>Use coins to unlock locked episodes</Text>
        </View>

        <Text style={styles.sectionTitle}>Get more coins</Text>
        <View style={styles.packsGrid}>
          {COIN_PACKS.map((pack) => (
            <Pressable
              key={pack.coins}
              style={styles.packCard}
              onPress={() => {
                addCoins(pack.coins);
                Alert.alert('Purchase simulated', `Added ${pack.coins} coins to your balance.`);
              }}
            >
              <Ionicons name="diamond" size={20} color={colors.accent} />
              <Text style={styles.packCoins}>{pack.coins}</Text>
              <Text style={styles.packPrice}>{pack.price}</Text>
            </Pressable>
          ))}
        </View>

        {user && (
          <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  signInBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  coinCard: { backgroundColor: colors.card, borderRadius: 16, padding: 18, gap: 6 },
  coinBalance: { color: colors.text, fontSize: 22, fontWeight: '800' },
  coinHint: { color: colors.textMuted, fontSize: 13 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  packsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  packCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  packCoins: { color: colors.text, fontWeight: '700', fontSize: 16 },
  packPrice: { color: colors.textMuted, fontSize: 13 },
  signOutBtn: { alignItems: 'center', paddingVertical: 14 },
  signOutText: { color: colors.primary, fontWeight: '600' },
});
