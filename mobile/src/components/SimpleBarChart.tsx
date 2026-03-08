/**
 * Simple horizontal bar chart (no Skia). Each item: label + bar width by value/max.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { colors } from '../theme';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export function SimpleBarChart({
  data,
  maxValue,
  formatValue = (n) => n.toLocaleString(),
  barHeight = 24,
  showValues = true,
}: {
  data: BarChartItem[];
  maxValue?: number;
  formatValue?: (n: number) => string;
  barHeight?: number;
  showValues?: boolean;
}) {
  const { textPrimary, textSecondary, isDark } = useAppTheme();
  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const computedMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrap}>
      {data.map((item, i) => (
        <View key={`${item.label}-${i}`} style={[styles.row, { marginBottom: 8 }]}>
          <View style={styles.labelRow}>
            <Text variant="bodySmall" style={[styles.label, { color: textSecondary }]} numberOfLines={1}>
              {item.label}
            </Text>
            {showValues && (
              <Text variant="bodySmall" style={[styles.value, { color: textPrimary }]}>
                {formatValue(item.value)}
              </Text>
            )}
          </View>
          <View style={[styles.track, { backgroundColor: trackBg }]}>
            <View
              style={[
                styles.bar,
                {
                  width: `${(item.value / computedMax) * 100}%`,
                  backgroundColor: item.color ?? colors.accent,
                  height: barHeight,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 4 },
  row: {},
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { flex: 1 },
  value: { marginLeft: 8 },
  track: { height: 24, borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
  bar: { borderRadius: 4 },
});
