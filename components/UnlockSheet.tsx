import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Episode, Series } from '../lib/data';
import { useApp } from '../lib/store';
import { colors } from '../lib/theme';

export default function UnlockSheet({
  visible,
  series,
  episode,
  onClose,
  onUnlocked,
}: {
  visible: boolean;
  series: Series | null;
  episode: Episode | null;
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const { coins, unlockEpisode } = useApp();
  if (!series || !episode) return null;

  const canAfford = coins >= series.coinsPerEpisode;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Ionicons name="lock-open" size={32} color={colors.accent} />
          <Text style={styles.title}>Unlock Episode {episode.index}</Text>
          <Text style={styles.subtitle}>{series.title}</Text>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Your balance</Text>
            <View style={styles.coinRow}>
              <Ionicons name="diamond" size={16} color={colors.accent} />
              <Text style={styles.balanceValue}>{coins}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.confirmBtn, !canAfford && styles.confirmBtnDisabled]}
            disabled={!canAfford}
            onPress={() => {
              const ok = unlockEpisode(series.id, episode.id, series.coinsPerEpisode);
              if (ok) onUnlocked();
            }}
          >
            <Ionicons name="diamond" size={16} color="#1A1A1A" />
            <Text style={styles.confirmBtnText}>
              {canAfford ? `Unlock for ${series.coinsPerEpisode} coins` : 'Not enough coins'}
            </Text>
          </Pressable>

          {!canAfford && (
            <Pressable
              style={styles.topUpBtn}
              onPress={() => {
                onClose();
              }}
            >
              <Text style={styles.topUpText}>Go to Profile to get more coins</Text>
            </Pressable>
          )}

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  balanceLabel: { color: colors.textMuted, fontSize: 14 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceValue: { color: colors.text, fontWeight: '700', fontSize: 16 },
  confirmBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 4,
  },
  confirmBtnDisabled: { backgroundColor: colors.border },
  confirmBtnText: { color: '#1A1A1A', fontWeight: '700', fontSize: 15 },
  topUpBtn: { marginTop: 10 },
  topUpText: { color: colors.primary, fontWeight: '600' },
  cancelBtn: { marginTop: 14, paddingBottom: 8 },
  cancelText: { color: colors.textMuted },
});
