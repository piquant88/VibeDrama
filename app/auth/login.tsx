import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const canSubmit = name.trim().length > 0 && email.trim().includes('@');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to VibeDrama</Text>
      <Text style={styles.subtitle}>Sign in to save your watch progress and coins.</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        disabled={!canSubmit}
        onPress={async () => {
          await signIn(name.trim(), email.trim());
          router.back();
        }}
      >
        <Text style={styles.submitText}>Continue</Text>
      </Pressable>

      <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Maybe later</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: colors.border },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: colors.textMuted },
});
