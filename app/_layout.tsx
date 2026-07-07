import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CatalogProvider } from '../lib/catalog';
import { AppProvider } from '../lib/store';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <CatalogProvider>
          <AppProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="series/[id]" />
              <Stack.Screen name="player/[seriesId]" options={{ animation: 'fade' }} />
            </Stack>
          </AppProvider>
        </CatalogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
