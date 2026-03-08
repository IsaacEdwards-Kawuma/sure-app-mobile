import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../src/hooks/useAppTheme';

const ONBOARDING_KEY = 'surelink_onboarding_done';

export default function OnboardingScreen() {
  const router = useRouter();
  const { background, primary, textPrimary, textSecondary } = useAppTheme();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]} accessibilityLabel="Welcome to SureLink">
      <Text variant="headlineLarge" style={[styles.title, { color: textPrimary }]}>
        Welcome to SureLink
      </Text>
      <Text variant="bodyLarge" style={[styles.subtitle, { color: textSecondary }]}>
        Track daily sales, vouchers, expenses, and assets. Sign in or create an account to get started.
      </Text>
      <Button
        mode="contained"
        onPress={handleGetStarted}
        style={[styles.button, { backgroundColor: primary }]}
        accessibilityLabel="Get started"
        accessibilityRole="button"
      >
        Get started
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  button: {
    minWidth: 200,
  },
});
