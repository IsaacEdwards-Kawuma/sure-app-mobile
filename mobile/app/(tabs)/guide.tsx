import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function GuideScreen() {
  const { background } = useAppTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: background }]} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall">In-app Guide</Text>
      <Text variant="bodyMedium">Help content (e.g. Markdown) — coming soon</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
