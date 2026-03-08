/**
 * Simple pie chart (stacked bar + legend). No Skia. Good for 2–6 segments.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { colors } from '../theme';

export interface PieChartItem {
  label: string;
  value: number;
  color?: string;
}

const PIE_COLORS = [colors.accent, colors.secondary, colors.primary, colors.success, colors.warning, colors.info, colors.danger];

export function SimplePieChart({
  data,
  formatValue = (n) => n.toLocaleString(),
  size = 140,
  showLegend = true,
}: {
  data: PieChartItem[];
  formatValue?: (n: number) => string;
  size?: number;
  showLegend?: boolean;
}) {
  const { textSecondary } = useAppTheme();
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const segments = useMemo(() => {
    if (total === 0) return data.map((d, i) => ({ ...d, percent: 0, color: d.color ?? PIE_COLORS[i % PIE_COLORS.length] }));
    return data.map((d, i) => ({
      ...d,
      percent: (d.value / total) * 100,
      color: d.color ?? PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [data, total]);

  if (data.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.pieRow, { height: size }]}>
        {segments.map((seg, i) => (
          <View
            key={`${seg.label}-${i}`}
            style={[
              styles.segment,
              {
                flex: seg.percent || 0.001,
                backgroundColor: seg.color,
              },
            ]}
          />
        ))}
      </View>
      {showLegend && (
        <View style={styles.legend}>
          {segments.map((seg, i) => (
            <View key={`${seg.label}-${i}`} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <Text variant="bodySmall" style={[styles.legendLabel, { color: textSecondary }]} numberOfLines={1}>
                {seg.label}: {formatValue(seg.value)}
                {total > 0 && ` (${seg.percent.toFixed(0)}%)`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  pieRow: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  segment: { minWidth: 2 },
  legend: { gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1 },
});
