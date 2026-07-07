import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CHECK_IN_REWARDS, useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

const AD_REWARD = 15;
const MAX_ADS_PER_DAY = 5;

export default function RewardsScreen() {
  const { coins, checkInStreak, canCheckInToday, dailyCheckIn, addCoins } = useApp();
  const [adsWatched, setAdsWatched] = useState(0);
  const [adPlaying, setAdPlaying] = useState(false);

  const claimable = canCheckInToday();
  // Day highlighted in the strip: next claimable day, capped at 7.
  const dayToday = Math.min(claimable ? checkInStreak + 1 : checkInStreak, CHECK_IN_REWARDS.length);

  const watchAd = () => {
    if (adPlaying || adsWatched >= MAX_ADS_PER_DAY) return;
    setAdPlaying(true);
    // Simulated ad — replace with a real ad SDK (AdMob etc.) later.
    setTimeout(() => {
      setAdPlaying(false);
      setAdsWatched((n) => n + 1);
      addCoins(AD_REWARD);
      Alert.alert('Reward earned', `+${AD_REWARD} coins added.`);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Rewards</Text>
          <View style={styles.coinPill}>
            <Ionicons name="diamond" size={14} color={colors.accent} />
            <Text style={styles.coinPillText}>{coins}</Text>
          </View>
        </View>

        {/* Daily check-in */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Check-in</Text>
          <Text style={styles.cardSub}>
            {checkInStreak > 0 ? `${checkInStreak}-day streak — keep it going!` : 'Check in every day for growing rewards'}
          </Text>
          <View style={styles.daysRow}>
            {CHECK_IN_REWARDS.map((reward, i) => {
              const day = i + 1;
              const done = !claimable ? day <= checkInStreak : day < checkInStreak + 1;
              const isNext = claimable && day === dayToday;
              return (
                <View key={day} style={[styles.dayCell, done && styles.dayDone, isNext && styles.dayNext]}>
                  <Text style={styles.dayNum}>D{day}</Text>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  ) : (
                    <Text style={styles.dayReward}>+{reward}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <Pressable
            style={[styles.claimBtn, !claimable && styles.claimBtnDisabled]}
            disabled={!claimable}
            onPress={() => {
              const earned = dailyCheckIn();
              if (earned > 0) Alert.alert('Checked in!', `+${earned} coins added.`);
            }}
          >
            <Text style={styles.claimText}>{claimable ? 'Check in now' : 'Come back tomorrow'}</Text>
          </Pressable>
        </View>

        {/* Watch ads */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Watch & Earn</Text>
          <Text style={styles.cardSub}>
            Watch a short ad to earn {AD_REWARD} coins ({adsWatched}/{MAX_ADS_PER_DAY} today)
          </Text>
          <Pressable
            style={[styles.claimBtn, (adPlaying || adsWatched >= MAX_ADS_PER_DAY) && styles.claimBtnDisabled]}
            disabled={adPlaying || adsWatched >= MAX_ADS_PER_DAY}
            onPress={watchAd}
          >
            <Ionicons name="play-circle" size={18} color="#1A1A1A" />
            <Text style={styles.claimText}>
              {adPlaying ? 'Playing ad…' : adsWatched >= MAX_ADS_PER_DAY ? 'Daily limit reached' : `Watch ad (+${AD_REWARD})`}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { color: colors.text, fontSize: 24, fontWeight: '800' },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinPillText: { color: colors.text, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  cardSub: { color: colors.textMuted, fontSize: 13 },
  daysRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  dayCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  dayDone: { opacity: 0.55 },
  dayNext: { borderWidth: 1.5, borderColor: colors.accent },
  dayNum: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  dayReward: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 22,
    paddingVertical: 12,
  },
  claimBtnDisabled: { backgroundColor: colors.border },
  claimText: { color: '#1A1A1A', fontWeight: '800', fontSize: 14 },
});
