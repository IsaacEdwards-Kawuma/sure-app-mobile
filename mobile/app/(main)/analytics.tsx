import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useSalesQuery } from '../../src/api/salesApi';
import { useExpensesQuery } from '../../src/api/expensesApi';
import { useAssetsQuery } from '../../src/api/assetsApi';
import { useVouchersQuery } from '../../src/api/vouchersApi';
import { SimpleBarChart } from '../../src/components/SimpleBarChart';
import { SimpleLineData } from '../../src/components/SimpleLineData';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';

export default function AnalyticsScreen() {
  const { spacing } = useResponsive();
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

  const revenueByDate = useMemo(() => {
    const sales = salesData?.sales ?? [];
    const sorted = [...sales].sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-14);
    return sorted.map((s) => ({
      label: s.date,
      value: s.total_revenue ?? 0,
    }));
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

  const assetsByCategory = useMemo(() => {
    const assets = assetsData?.assets ?? [];
    const byCat: Record<string, number> = {};
    assets.forEach((a) => {
      const cat = a.category || 'Other';
      const v = a.value ?? 0;
      byCat[cat] = (byCat[cat] ?? 0) + v;
    });
    return Object.entries(byCat).map(([label, value]) => ({ label, value }));
  }, [assetsData]);

  const voucherSummary = useMemo(() => {
    const vouchers = vouchersData?.vouchers ?? [];
    const sold = vouchers.filter((v) => v.status === 'sold');
    const value = sold.reduce((s, v) => s + (v.price ?? 0), 0);
    return { count: sold.length, value };
  }, [vouchersData]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text variant="titleMedium" style={[styles.title, { color: textPrimary }]}>Analytics</Text>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={[styles.cardTitle, { color: textPrimary }]}>Revenue by date (last 14 entries)</Text>
          {revenueByDate.length === 0 ? (
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>No sales data yet.</Text>
          ) : (
            <SimpleLineData data={revenueByDate} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} />
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={[styles.cardTitle, { color: textPrimary }]}>Expenses by category</Text>
          {expensesByCategory.length === 0 ? (
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>No expenses yet.</Text>
          ) : (
            <SimpleBarChart data={expensesByCategory} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} />
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={[styles.cardTitle, { color: textPrimary }]}>Asset value by category</Text>
          {assetsByCategory.length === 0 ? (
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>No assets yet.</Text>
          ) : (
            <SimpleBarChart data={assetsByCategory} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} />
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleSmall" style={[styles.cardTitle, { color: textPrimary }]}>Voucher sales</Text>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.muted, { color: textSecondary }]}>Vouchers sold</Text>
            <Text variant="titleMedium" style={styles.value}>{voucherSummary.count}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.muted, { color: textSecondary }]}>Total value</Text>
            <Text variant="titleMedium" style={styles.value}>{voucherSummary.value.toLocaleString()} UGX</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  title: { marginBottom: 16 },
  card: { marginBottom: 16 },
  cardTitle: { marginBottom: 12 },
  muted: {},
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  value: { color: colors.accent },
});
