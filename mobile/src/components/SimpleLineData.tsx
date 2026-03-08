/**
 * Simple “sparkline” style list: label + value per row (e.g. revenue by date).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { colors } from '../theme';

export interface LineDataItem {
  label: string;
  value: number;
}

export function SimpleLineData({
  data,
  formatValue = (n) => n.toLocaleString(),
  title,
}: {
  data: LineDataItem[];
  formatValue?: (n: number) => string;
  title?: string;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  if (data.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text variant="labelLarge" style={[styles.title, { color: textSecondary }]}>{title}</Text>
      ) : null}
      {data.map((item, i) => (
        <View key={`${item.label}-${i}`} style={[styles.row, { borderBottomColor: borderSubtle }]}>
          <Text variant="bodySmall" style={[styles.label, { color: textSecondary }]} numberOfLines={1}>{item.label}</Text>
          <Text variant="bodyMedium" style={styles.value}>{formatValue(item.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  title: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
  label: { flex: 1 },
  value: { color: colors.accent, fontWeight: '600' },
});
