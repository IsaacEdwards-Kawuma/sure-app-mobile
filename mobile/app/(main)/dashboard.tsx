import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, View } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSalesQuery } from '../../src/api/salesApi';
import { useExpensesQuery } from '../../src/api/expensesApi';
import { useAssetsQuery } from '../../src/api/assetsApi';
import { useVouchersQuery } from '../../src/api/vouchersApi';
import { CountUpNumber } from '../../src/components/CountUpNumber';
import { SimpleBarChart } from '../../src/components/SimpleBarChart';
import { SimplePieChart } from '../../src/components/SimplePieChart';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';

const QUICK_ACTIONS = [
  { href: '/(main)/daily-entry', icon: 'calendar-edit', label: 'Daily Entry' },
  { href: '/(main)/sales-log', icon: 'format-list-bulleted', label: 'Sales Log' },
  { href: '/(main)/expenses', icon: 'cash-minus', label: 'Expenses' },
  { href: '/(main)/assets', icon: 'briefcase', label: 'Assets' },
  { href: '/(main)/vouchers', icon: 'ticket-percent', label: 'Vouchers' },
  { href: '/(main)/analytics', icon: 'chart-line', label: 'Analytics' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { spacing, cardMinWidth } = useResponsive();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { data: salesData, refetch: refetchSales, isFetching: salesFetching } = useSalesQuery();
  const { data: expensesData, refetch: refetchExpenses, isFetching: expensesFetching } = useExpensesQuery();
  const { data: assetsData, refetch: refetchAssets, isFetching: assetsFetching } = useAssetsQuery();
  const { data: vouchersData, refetch: refetchVouchers, isFetching: vouchersFetching } = useVouchersQuery();

  const refetch = () => {
    refetchSales();
    refetchExpenses();
    refetchAssets();
    refetchVouchers();
  };
  const isFetching = salesFetching || expensesFetching || assetsFetching || vouchersFetching;

  const { totalRevenue, netAfterExpenses, bestDay, avgPerDay, downtimeDays, totalExpenses, voucherTotal, voucherSold, voucherUnused } = useMemo(() => {
    const sales = salesData?.sales ?? [];
    const expenses = expensesData?.expenses ?? [];
    const vouchers = vouchersData?.vouchers ?? [];

    const totalRevenue = sales.reduce((s, r) => s + (r.total_revenue || 0), 0);
    const totalExpensesSum = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netAfterExpenses = totalRevenue - totalExpensesSum;
    const bestDay = sales.length ? Math.max(...sales.map((r) => r.total_revenue || 0)) : 0;
    const daysWithSales = sales.length;
    const avgPerDay = daysWithSales ? totalRevenue / daysWithSales : 0;
    const downtimeDays = sales.reduce((s, r) => s + (r.downtime ? 1 : 0), 0);

    const unused = vouchers.filter((v) => v.status === 'unused');
    const sold = vouchers.filter((v) => v.status === 'sold');
    return {
      totalRevenue,
      netAfterExpenses,
      bestDay,
      avgPerDay,
      downtimeDays,
      totalExpenses: totalExpensesSum,
      voucherTotal: vouchers.length,
      voucherSold: sold.length,
      voucherUnused: unused.length,
    };
  }, [salesData, expensesData, vouchersData]);

  const revenueLast7 = useMemo(() => {
    const sales = salesData?.sales ?? [];
    const sorted = [...sales].sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-7);
    return sorted.map((s) => ({ label: s.date, value: s.total_revenue ?? 0 }));
  }, [salesData]);

  const expensesByCategory = useMemo(() => {
    const expenses = expensesData?.expenses ?? [];
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      byCat[cat] = (byCat[cat] ?? 0) + (e.amount ?? 0);
    });
    return Object.entries(byCat).map(([label, value]) => ({ label, value }));
  }, [expensesData]);

  const voucherPieData = useMemo(() => {
    const vouchers = vouchersData?.vouchers ?? [];
    const sold = vouchers.filter((v) => v.status === 'sold').length;
    const unused = vouchers.filter((v) => v.status === 'unused').length;
    const out: { label: string; value: number }[] = [];
    if (sold > 0) out.push({ label: 'Sold', value: sold });
    if (unused > 0) out.push({ label: 'Unused', value: unused });
    if (out.length === 0) out.push({ label: 'No vouchers', value: 1 });
    return out;
  }, [vouchersData]);

  const assetsByCategory = useMemo(() => {
    const assets = assetsData?.assets ?? [];
    const byCat: Record<string, number> = {};
    assets.forEach((a) => {
      const cat = a.category || 'Other';
      byCat[cat] = (byCat[cat] ?? 0) + (a.value ?? 0);
    });
    return Object.entries(byCat).map(([label, value]) => ({ label, value }));
  }, [assetsData]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.kpiRow, { gap: spacing.sm }]}>
        <Card style={[styles.kpiCard, { minWidth: cardMinWidth }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Total Revenue</Text>
            <CountUpNumber value={Math.round(totalRevenue)} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={[styles.kpiCard, { minWidth: cardMinWidth }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Net After Expenses</Text>
            <CountUpNumber value={Math.round(netAfterExpenses)} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={[styles.kpiCard, { minWidth: cardMinWidth }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Best Single Day</Text>
            <CountUpNumber value={Math.round(bestDay)} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={[styles.kpiCard, { minWidth: cardMinWidth }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Avg / Day</Text>
            <CountUpNumber value={Math.round(avgPerDay)} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
        <Card style={[styles.kpiCard, { minWidth: cardMinWidth }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Downtime Days</Text>
            <CountUpNumber value={downtimeDays} style={[styles.kpiValue, downtimeDays > 0 && { color: colors.danger }]} />
          </Card.Content>
        </Card>
        <Card style={[styles.kpiCard, { minWidth: cardMinWidth }]}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.kpiLabel}>Total Expenses</Text>
            <CountUpNumber value={Math.round(totalExpenses)} format={(n) => `${n.toLocaleString()} UGX`} style={styles.kpiValue} />
          </Card.Content>
        </Card>
      </ScrollView>
      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: textPrimary }}>Voucher Stock</Text>
          <Text variant="bodyMedium" style={[styles.muted, { color: textSecondary }]}>
            Total: {voucherTotal} · Sold: {voucherSold} · Unused: {voucherUnused}
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={[styles.sectionTitle, { color: textSecondary }]}>Charts & graphs</Text>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={[styles.chartTitle, { color: textPrimary }]}>Revenue (last 7 days)</Text>
          {revenueLast7.length === 0 ? (
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>No sales data yet.</Text>
          ) : (
            <SimpleBarChart
              data={revenueLast7}
              formatValue={(n) => `${(n / 1000).toFixed(0)}k UGX`}
              barHeight={28}
            />
          )}
        </Card.Content>
      </Card>

      <View style={styles.chartRow}>
        <Card style={[styles.card, styles.chartHalf, { backgroundColor: surface }]}>
          <Card.Content>
            <Text variant="titleSmall" style={[styles.chartTitle, { color: textPrimary }]}>Expenses by category</Text>
            {expensesByCategory.length === 0 ? (
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>No expenses yet.</Text>
            ) : (
              <SimplePieChart data={expensesByCategory} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} size={100} />
            )}
          </Card.Content>
        </Card>
        <Card style={[styles.card, styles.chartHalf, { backgroundColor: surface }]}>
          <Card.Content>
            <Text variant="titleSmall" style={[styles.chartTitle, { color: textPrimary }]}>Voucher status</Text>
            <SimplePieChart data={voucherPieData} formatValue={(n) => `${n}`} size={100} />
          </Card.Content>
        </Card>
      </View>

      {assetsByCategory.length > 0 && (
        <Card style={[styles.card, { backgroundColor: surface }]}>
          <Card.Content>
            <Text variant="titleSmall" style={[styles.chartTitle, { color: textPrimary }]}>Asset value by category</Text>
            <SimplePieChart data={assetsByCategory} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} size={100} />
          </Card.Content>
        </Card>
      )}

      <Text variant="titleMedium" style={[styles.sectionTitle, { color: textSecondary }]}>Quick actions</Text>
      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.href}
            style={[styles.quickCard, { backgroundColor: surface }]}
            onPress={() => router.push(action.href as any)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={action.icon as any} size={28} color={colors.accent} />
            <Text variant="labelMedium" style={[styles.quickLabel, { color: textPrimary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  kpiRow: { marginBottom: 16, paddingVertical: 4 },
  kpiCard: { backgroundColor: colors.primary },
  kpiLabel: { color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  kpiValue: { color: '#fff', fontWeight: '700' },
  card: { marginBottom: 12 },
  muted: { marginTop: 4 },
  sectionTitle: { marginBottom: 12 },
  chartTitle: { marginBottom: 8 },
  chartRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  chartHalf: { flex: 1, minWidth: 140 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    minWidth: 100,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { marginTop: 8 },
});
