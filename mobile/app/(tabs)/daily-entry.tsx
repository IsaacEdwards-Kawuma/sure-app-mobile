import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function DailyEntryScreen() {
  const { background } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text variant="headlineSmall">Daily Entry</Text>
      <Text variant="bodyMedium">Form: date, attendant, revenue, expenses — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
