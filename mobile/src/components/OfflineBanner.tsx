import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useOffline } from '../features/network/useOffline';

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLabel="You are offline">
      <Text variant="labelMedium" style={styles.text}>
        You're offline. Some features may be unavailable.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#B71C1C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
