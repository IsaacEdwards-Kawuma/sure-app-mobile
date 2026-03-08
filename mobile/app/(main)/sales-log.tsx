import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useSalesQuery, useDeleteSaleMutation } from '../../src/api/salesApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';
import { subDays, parseISO, isAfter } from 'date-fns';

type DateRange = 'all' | '7' | '30';
type SortOrder = 'newest' | 'oldest';

export default function SalesLogScreen() {
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { data, refetch, isFetching } = useSalesQuery();
  const [deleteSale] = useDeleteSaleMutation();
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const sales = data?.sales ?? [];

  const filteredAndSorted = useMemo(() => {
    const cutoff = dateRange === 'all' ? null : dateRange === '7' ? subDays(new Date(), 7) : subDays(new Date(), 30);
    let list = cutoff
      ? sales.filter((s) => {
          try {
            const d = parseISO(s.date);
            return isAfter(d, cutoff) || d.getTime() === cutoff.getTime();
          } catch {
            return true;
          }
        })
      : sales;
    list = [...list].sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      return sortOrder === 'newest' ? (db.localeCompare(da)) : (da.localeCompare(db));
    });
    return list;
  }, [sales, dateRange, sortOrder]);

  const summary = useMemo(() => {
    const total = filteredAndSorted.reduce((s, r) => s + (r.total_revenue ?? 0), 0);
    return { count: filteredAndSorted.length, total };
  }, [filteredAndSorted]);

  const handleDelete = (id: number) => {
    Alert.alert('Delete entry', 'Remove this daily entry? Expenses linked to it will also be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSale({ id }).unwrap();
          } catch {
            Alert.alert('Error', 'Could not delete entry');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text variant="titleMedium" style={[styles.title, { color: textPrimary }]}>Daily entries (sales)</Text>

      <View style={styles.filterRow}>
        <Button compact mode={dateRange === 'all' ? 'contained' : 'outlined'} onPress={() => setDateRange('all')} style={styles.filterBtn}>All</Button>
        <Button compact mode={dateRange === '7' ? 'contained' : 'outlined'} onPress={() => setDateRange('7')} style={styles.filterBtn}>Last 7 days</Button>
        <Button compact mode={dateRange === '30' ? 'contained' : 'outlined'} onPress={() => setDateRange('30')} style={styles.filterBtn}>Last 30 days</Button>
      </View>
      <View style={styles.filterRow}>
        <Button compact mode={sortOrder === 'newest' ? 'contained' : 'outlined'} onPress={() => setSortOrder('newest')} style={styles.filterBtn}>Newest first</Button>
        <Button compact mode={sortOrder === 'oldest' ? 'contained' : 'outlined'} onPress={() => setSortOrder('oldest')} style={styles.filterBtn}>Oldest first</Button>
      </View>

      <Card style={[styles.summaryCard, { backgroundColor: surface }]}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.muted, { color: textSecondary }]}>Entries shown</Text>
            <Text variant="titleMedium" style={styles.value}>{summary.count}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.muted, { color: textSecondary }]}>Total revenue</Text>
            <Text variant="titleMedium" style={styles.value}>{Math.round(summary.total).toLocaleString()} UGX</Text>
          </View>
        </Card.Content>
      </Card>

      {filteredAndSorted.length === 0 ? (
        <Text variant="bodyMedium" style={[styles.empty, { color: textSecondary }]}>No entries in this range. Add one from Daily Entry.</Text>
      ) : (
        filteredAndSorted.map((sale) => (
          <Card key={sale.id} style={[styles.card, { backgroundColor: surface }]}>
            <Card.Content>
              <View style={styles.row}>
                <Text variant="titleSmall" style={[styles.date, { color: textPrimary }]}>{sale.date}</Text>
                <Text variant="bodyMedium" style={styles.revenue}>
                  {(sale.total_revenue ?? 0).toLocaleString()} UGX
                </Text>
              </View>
              {(sale.attendant_name || sale.notes) && (
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                  {sale.attendant_name && `Attendant: ${sale.attendant_name}`}
                  {sale.attendant_name && sale.notes ? ' · ' : ''}
                  {sale.notes || ''}
                </Text>
              )}
              {sale.downtime ? (
                <Text variant="bodySmall" style={styles.downtime}>Downtime: {sale.downtime} day(s)</Text>
              ) : null}
              <Button mode="text" compact onPress={() => handleDelete(sale.id)} textColor={colors.danger} style={styles.deleteBtn}>
                Delete
              </Button>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  title: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  filterBtn: { marginRight: 4 },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  value: { color: colors.accent },
  empty: {},
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  date: {},
  revenue: { color: colors.accent, fontWeight: '600' },
  muted: { marginTop: 4 },
  downtime: { color: colors.warning, marginTop: 2 },
  deleteBtn: { alignSelf: 'flex-start', marginTop: 8 },
});
