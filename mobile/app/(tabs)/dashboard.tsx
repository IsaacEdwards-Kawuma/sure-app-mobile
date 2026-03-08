import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useSettingsQuery } from '../../src/api/settingsApi';
import { CountUpNumber } from '../../src/components/CountUpNumber';
import { colors } from '../../src/theme';

export default function DashboardScreen() {
  const { data: settings, refetch, isFetching } = useSettingsQuery();

  const totalRevenue = 0;
  const netAfterExpenses = 0;
  const bestDay = 0;
  const avgPerDay = 0;
  const downtimeDays = 0;
  const totalExpenses = 0;
  const voucherTotal = 0;
  const voucherSold = 0;
  const voucherUnused = 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Dashboard
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Total Revenue</Text>
            <CountUpNumber value={totalRevenue} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Net After Expenses</Text>
            <CountUpNumber value={netAfterExpenses} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Best Single Day</Text>
            <CountUpNumber value={bestDay} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Avg / Day</Text>
            <CountUpNumber value={avgPerDay} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Downtime Days</Text>
            <CountUpNumber value={downtimeDays} style={[styles.kpiValue, downtimeDays > 0 && { color: colors.danger }]} />
          </Card.Content>
        </Card>
        <Card style={styles.kpiCard}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Total Expenses</Text>
            <CountUpNumber value={totalExpenses} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
      </ScrollView>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Voucher Stock</Text>
          <Text variant="bodyMedium" style={styles.muted}>
            Total: {voucherTotal} · Sold: {voucherSold} · Unused: {voucherUnused}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundDark },
  content: { padding: 16 },
  title: { color: '#fff', marginBottom: 16 },
  kpiRow: { gap: 12, marginBottom: 16, paddingVertical: 4 },
  kpiCard: { minWidth: 140, backgroundColor: colors.primary },
  kpiLabel: { color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  kpiValue: { color: '#fff', fontWeight: '700' },
  card: { marginBottom: 12, backgroundColor: colors.surfaceDark },
  muted: { color: '#94a3b8', marginTop: 4 },
});
