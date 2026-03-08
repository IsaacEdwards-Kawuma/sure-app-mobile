import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSalesQuery, useDeleteSaleMutation } from '../../src/api/salesApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';
import { subDays, parseISO, isAfter } from 'date-fns';

type DateRange = 'all' | '7' | '30';
type SortOrder = 'newest' | 'oldest';

export default function SalesLogScreen() {
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary, borderSubtle } = useAppTheme();
  const { data, refetch, isFetching } = useSalesQuery();
  const [deleteSale] = useDeleteSaleMutation();
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');

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
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          (s.date || '').toLowerCase().includes(q) ||
          (s.attendant_name || '').toLowerCase().includes(q) ||
          (s.notes || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      return sortOrder === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
    });
    return list;
  }, [sales, dateRange, sortOrder, searchQuery]);

  const summary = useMemo(() => {
    const total = filteredAndSorted.reduce((s, r) => s + (r.total_revenue ?? 0), 0);
    const avg = filteredAndSorted.length ? total / filteredAndSorted.length : 0;
    return { count: filteredAndSorted.length, total, avg };
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
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <Text variant="titleLarge" style={[styles.title, { color: textPrimary }]}>
          Sales log
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
          Daily entries and revenue
        </Text>

        <View style={styles.filterRow}>
          <Button
            compact
            mode={dateRange === 'all' ? 'contained' : 'outlined'}
            onPress={() => setDateRange('all')}
            style={styles.filterBtn}
          >
            All
          </Button>
          <Button
            compact
            mode={dateRange === '7' ? 'contained' : 'outlined'}
            onPress={() => setDateRange('7')}
            style={styles.filterBtn}
          >
            7 days
          </Button>
          <Button
            compact
            mode={dateRange === '30' ? 'contained' : 'outlined'}
            onPress={() => setDateRange('30')}
            style={styles.filterBtn}
          >
            30 days
          </Button>
        </View>
        <View style={styles.filterRow}>
          <Button
            compact
            mode={sortOrder === 'newest' ? 'contained' : 'outlined'}
            onPress={() => setSortOrder('newest')}
            style={styles.filterBtn}
          >
            Newest
          </Button>
          <Button
            compact
            mode={sortOrder === 'oldest' ? 'contained' : 'outlined'}
            onPress={() => setSortOrder('oldest')}
            style={styles.filterBtn}
          >
            Oldest
          </Button>
        </View>

        <TextInput
          mode="outlined"
          placeholder="Search by date, attendant or notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={[styles.searchInput, { backgroundColor: surface }]}
          placeholderTextColor={textSecondary}
        />

        <Card style={[styles.summaryCard, { backgroundColor: surface }]}>
          <Card.Content>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                  Entries
                </Text>
                <Text variant="titleLarge" style={[styles.summaryValue, { color: colors.accent }]}>
                  {summary.count}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: borderSubtle }]} />
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                  Total revenue
                </Text>
                <Text variant="titleMedium" style={[styles.summaryValue, { color: colors.success }]} numberOfLines={1}>
                  {Math.round(summary.total).toLocaleString()} UGX
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: borderSubtle }]} />
              <View style={styles.summaryItem}>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                  Avg / entry
                </Text>
                <Text variant="titleSmall" style={[styles.summaryValue, { color: textPrimary }]}>
                  {Math.round(summary.avg).toLocaleString()} UGX
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {filteredAndSorted.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="chart-line-variant" size={48} color={textSecondary} />
            <Text variant="bodyLarge" style={[styles.empty, { color: textSecondary }]}>
              {searchQuery.trim()
                ? 'No entries match your search.'
                : 'No entries in this range. Add one from Daily Entry.'}
            </Text>
          </View>
        ) : (
          filteredAndSorted.map((sale) => (
            <Card key={sale.id} style={[styles.card, { backgroundColor: surface }]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.row}>
                  <View>
                    <Text variant="titleMedium" style={[styles.date, { color: textPrimary }]}>
                      {sale.date}
                    </Text>
                    <Text variant="titleSmall" style={[styles.revenue, { color: colors.accent }]}>
                      {(sale.total_revenue ?? 0).toLocaleString()} UGX
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleDelete(sale.id)}
                    textColor={colors.danger}
                    icon="delete-outline"
                    style={styles.deleteBtn}
                  >
                    Delete
                  </Button>
                </View>
                {(sale.attendant_name || sale.notes) && (
                  <Text variant="bodySmall" style={[styles.muted, { color: textSecondary, marginTop: 6 }]}>
                    {sale.attendant_name && `Attendant: ${sale.attendant_name}`}
                    {sale.attendant_name && sale.notes ? ' · ' : ''}
                    {sale.notes || ''}
                  </Text>
                )}
                {sale.downtime ? (
                  <View style={styles.downtimeRow}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
                    <Text variant="bodySmall" style={styles.downtime}>
                      Downtime: {sale.downtime} day(s)
                    </Text>
                  </View>
                ) : null}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  filterBtn: { marginRight: 6, marginBottom: 4 },
  searchInput: { marginBottom: 16 },
  summaryCard: { marginBottom: 20 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1 },
  summaryDivider: { width: 1, height: 36 },
  summaryValue: { fontWeight: '700', marginTop: 2 },
  muted: {},
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  empty: { marginTop: 12, textAlign: 'center' },
  card: { marginBottom: 12 },
  cardContent: { paddingVertical: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  date: {},
  revenue: { fontWeight: '600', marginTop: 2 },
  deleteBtn: { alignSelf: 'flex-start' },
  downtimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  downtime: { color: colors.warning },
});
