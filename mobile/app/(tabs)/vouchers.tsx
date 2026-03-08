import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function VouchersScreen() {
  const { background } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text variant="headlineSmall">Vouchers</Text>
      <Text variant="bodyMedium">Filter, batch generate, sell — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
