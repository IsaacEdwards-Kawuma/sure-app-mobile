import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useSalesQuery } from '../../src/api/salesApi';
import { useVouchersQuery } from '../../src/api/vouchersApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';

export default function ReconcileScreen() {
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { data: salesData, refetch: refetchSales, isFetching: salesFetching } = useSalesQuery();
  const { data: vouchersData, refetch: refetchVouchers, isFetching: vouchersFetching } = useVouchersQuery();

  const refetch = () => {
    refetchSales();
    refetchVouchers();
  };
  const isFetching = salesFetching || vouchersFetching;

  const { totalRevenue, totalVoucherSales, soldCount, variance } = useMemo(() => {
    const sales = salesData?.sales ?? [];
    const vouchers = vouchersData?.vouchers ?? [];
    const totalRevenue = sales.reduce((s, r) => s + (r.total_revenue || 0), 0);
    const sold = vouchers.filter((v) => v.status === 'sold');
    const totalVoucherSales = sold.reduce((s, v) => s + (v.price ?? 0), 0);
    const variance = totalRevenue - totalVoucherSales;
    return {
      totalRevenue,
      totalVoucherSales,
      soldCount: sold.length,
      variance,
    };
  }, [salesData, vouchersData]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text variant="titleMedium" style={[styles.title, { color: textPrimary }]}>Reconcile</Text>
      <Text variant="bodySmall" style={[styles.subtitle, { color: textSecondary }]}>Compare total revenue (daily entries) vs voucher sales value.</Text>
      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="labelMedium" style={[styles.label, { color: textSecondary }]}>Revenue (from daily entries)</Text>
          <Text variant="headlineSmall" style={styles.value}>{totalRevenue.toLocaleString()} UGX</Text>
        </Card.Content>
      </Card>
      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="labelMedium" style={[styles.label, { color: textSecondary }]}>Voucher sales (sold vouchers value)</Text>
          <Text variant="headlineSmall" style={styles.value}>{totalVoucherSales.toLocaleString()} UGX</Text>
          <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>{soldCount} voucher(s) sold</Text>
        </Card.Content>
      </Card>
      <Card style={[styles.card, { backgroundColor: surface }, variance !== 0 && styles.cardWarning]}>
        <Card.Content>
          <Text variant="labelMedium" style={[styles.label, { color: textSecondary }]}>Variance</Text>
          <Text variant="headlineSmall" style={[styles.value, variance < 0 && { color: colors.danger }]}>
            {variance >= 0 ? '' : '-'}{Math.abs(variance).toLocaleString()} UGX
          </Text>
          <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
            {variance === 0 ? 'Revenue and voucher sales match.' : variance > 0 ? 'Revenue is higher (e.g. other income).' : 'Voucher sales exceed recorded revenue.'}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 16 },
  card: { marginBottom: 12 },
  cardWarning: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  label: { marginBottom: 4 },
  value: { color: colors.accent, fontWeight: '700' },
  muted: { marginTop: 4 },
});
