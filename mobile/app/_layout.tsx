import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { store } from '../src/store';
import { useThemeStore } from '../src/features/theme/themeStore';
import { OfflineBanner } from '../src/components/OfflineBanner';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useThemeStore((s) => s.theme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().finally(() => SplashScreen.hideAsync());
  }, [hydrate]);

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.flex}>
        <PaperProvider theme={theme}>
          <View style={styles.flex}>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(main)" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="onboarding" />
            </Stack>
          </View>
          <Toast />
        </PaperProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
