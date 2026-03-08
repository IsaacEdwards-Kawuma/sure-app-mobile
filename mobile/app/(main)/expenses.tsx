import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Card, Button, TextInput, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } from '../../src/api/expensesApi';
import { useSettingsQuery } from '../../src/api/settingsApi';
import { SimpleBarChart } from '../../src/components/SimpleBarChart';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';
import type { Expense } from '../../src/api/expensesApi';
import { startOfMonth, subMonths, parseISO, isAfter, format } from 'date-fns';

type DateRange = 'all' | 'this_month' | 'last_month';
type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export default function ExpensesScreen() {
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { data, refetch, isFetching } = useExpensesQuery();
  const { data: settings } = useSettingsQuery();
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const expenses = data?.expenses ?? [];
  const categories = (settings?.expense_categories as { name: string }[] | undefined) ?? [];

  const dateFiltered = useMemo(() => {
    if (dateRange === 'all') return expenses;
    const now = new Date();
    const thisStart = startOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    return expenses.filter((e) => {
      try {
        const d = parseISO(e.created_at);
        if (dateRange === 'this_month') return isAfter(d, thisStart) || d.getTime() === thisStart.getTime();
        return (isAfter(d, lastStart) || d.getTime() === lastStart.getTime()) && d < thisStart;
      } catch {
        return true;
      }
    });
  }, [expenses, dateRange]);

  const categoryFiltered = useMemo(() => {
    return categoryFilter
      ? dateFiltered.filter((e) => (e.category || '').toLowerCase() === categoryFilter.toLowerCase())
      : dateFiltered;
  }, [dateFiltered, categoryFilter]);

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryFiltered;
    return categoryFiltered.filter(
      (e) =>
        (e.description || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.subcategory || '').toLowerCase().includes(q)
    );
  }, [categoryFiltered, searchQuery]);

  const filteredAndSorted = useMemo(() => {
    const list = [...searchFiltered];
    if (sortBy === 'date_desc') list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    else if (sortBy === 'date_asc') list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    else if (sortBy === 'amount_desc') list.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    else list.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
    return list;
  }, [searchFiltered, sortBy]);

  const totalAmount = filteredAndSorted.reduce((s, e) => s + e.amount, 0);

  const byCategoryChart = useMemo(() => {
    const byCat: Record<string, number> = {};
    dateFiltered.forEach((e) => {
      const cat = e.category || 'Other';
      byCat[cat] = (byCat[cat] ?? 0) + (e.amount ?? 0);
    });
    return Object.entries(byCat).map(([label, value]) => ({ label, value }));
  }, [dateFiltered]);

  const openAdd = () => {
    setEditingExpense(null);
    setDesc('');
    setCategory('');
    setAmount('');
    setError(null);
    setModalVisible(true);
  };

  const openEdit = (e: Expense) => {
    setEditingExpense(e);
    setDesc(e.description || '');
    setCategory(e.category || '');
    setAmount(String(e.amount ?? ''));
    setError(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    setError(null);
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid amount');
      return;
    }
    try {
      if (editingExpense) {
        await updateExpense({
          id: editingExpense.id,
          body: {
            description: desc.trim() || undefined,
            category: category.trim() || undefined,
            amount: num,
          },
        }).unwrap();
      } else {
        await createExpense({
          description: desc.trim() || undefined,
          category: category.trim() || undefined,
          amount: num,
        }).unwrap();
      }
      setModalVisible(false);
    } catch (e: unknown) {
      setError((e as { data?: { error?: string } })?.data?.error || 'Failed to save expense');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete expense', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(id).unwrap();
          } catch {
            Alert.alert('Error', 'Could not delete');
          }
        },
      },
    ]);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return format(parseISO(iso), 'MMM d, yyyy');
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <View>
            <Text variant="titleLarge" style={[styles.title, { color: textPrimary }]}>
              Expenses
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
              Track spending by category
            </Text>
          </View>
          <Button mode="contained" onPress={openAdd} compact icon="plus">
            Add
          </Button>
        </View>

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
            mode={dateRange === 'this_month' ? 'contained' : 'outlined'}
            onPress={() => setDateRange('this_month')}
            style={styles.filterBtn}
          >
            This month
          </Button>
          <Button
            compact
            mode={dateRange === 'last_month' ? 'contained' : 'outlined'}
            onPress={() => setDateRange('last_month')}
            style={styles.filterBtn}
          >
            Last month
          </Button>
        </View>

        {categories.length > 0 && (
          <View style={styles.filterRow}>
            <Chip
              selected={!categoryFilter}
              onPress={() => setCategoryFilter('')}
              style={[styles.chip, !categoryFilter && { backgroundColor: colors.primary }]}
              textStyle={{ color: !categoryFilter ? '#fff' : textSecondary }}
            >
              All
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.name}
                selected={categoryFilter === c.name}
                onPress={() => setCategoryFilter(c.name)}
                style={[styles.chip, categoryFilter === c.name && { backgroundColor: colors.secondary }]}
                textStyle={{ color: categoryFilter === c.name ? '#fff' : textSecondary }}
              >
                {c.name}
              </Chip>
            ))}
          </View>
        )}

        <TextInput
          mode="outlined"
          placeholder="Search description or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={[styles.searchInput, { backgroundColor: surface }]}
          placeholderTextColor={textSecondary}
        />

        <View style={styles.sortRow}>
          <Text variant="bodySmall" style={[styles.sortLabel, { color: textSecondary }]}>
            Sort:
          </Text>
          <Button
            compact
            mode={sortBy === 'date_desc' ? 'contained' : 'outlined'}
            onPress={() => setSortBy('date_desc')}
            style={styles.sortBtn}
          >
            Newest
          </Button>
          <Button
            compact
            mode={sortBy === 'date_asc' ? 'contained' : 'outlined'}
            onPress={() => setSortBy('date_asc')}
            style={styles.sortBtn}
          >
            Oldest
          </Button>
          <Button
            compact
            mode={sortBy === 'amount_desc' ? 'contained' : 'outlined'}
            onPress={() => setSortBy('amount_desc')}
            style={styles.sortBtn}
          >
            Highest
          </Button>
          <Button
            compact
            mode={sortBy === 'amount_asc' ? 'contained' : 'outlined'}
            onPress={() => setSortBy('amount_asc')}
            style={styles.sortBtn}
          >
            Lowest
          </Button>
        </View>

        <Card style={[styles.totalCard, { backgroundColor: surface }]}>
          <Card.Content style={styles.totalCardContent}>
            <Text variant="bodyMedium" style={[styles.totalLabel, { color: textSecondary }]}>
              Total ({filteredAndSorted.length} items)
            </Text>
            <Text variant="headlineSmall" style={[styles.totalValue, { color: colors.accent }]}>
              {totalAmount.toLocaleString()} UGX
            </Text>
          </Card.Content>
        </Card>

        {byCategoryChart.length > 0 && (
          <Card style={[styles.card, { backgroundColor: surface }]}>
            <Card.Content>
              <Text variant="titleSmall" style={[styles.cardTitle, { color: textPrimary }]}>
                By category ({dateRange === 'all' ? 'all time' : dateRange === 'this_month' ? 'this month' : 'last month'})
              </Text>
              <SimpleBarChart data={byCategoryChart} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} barHeight={22} />
            </Card.Content>
          </Card>
        )}

        {filteredAndSorted.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="cash-minus" size={48} color={textSecondary} />
            <Text variant="bodyLarge" style={[styles.empty, { color: textSecondary }]}>
              {searchQuery.trim() ? 'No expenses match your search.' : 'No expenses. Tap Add to record one.'}
            </Text>
          </View>
        ) : (
          filteredAndSorted.map((e) => (
            <Card key={e.id} style={[styles.card, { backgroundColor: surface }]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.row}>
                  <View>
                    <Text variant="titleMedium" style={[styles.amount, { color: colors.accent }]}>
                      {(e.amount ?? 0).toLocaleString()} UGX
                    </Text>
                    <Text variant="bodySmall" style={[styles.dateText, { color: textSecondary }]}>
                      {formatDate(e.created_at)}
                    </Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Button mode="text" compact onPress={() => openEdit(e)} textColor={colors.accent} icon="pencil">
                      Edit
                    </Button>
                    <Button mode="text" compact onPress={() => handleDelete(e.id)} textColor={colors.danger} icon="delete-outline">
                      Delete
                    </Button>
                  </View>
                </View>
                {(e.description || e.category) && (
                  <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                    {e.category && `[${e.category}] `}
                    {e.description || ''}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: textPrimary }]}>
              {editingExpense ? 'Edit expense' : 'Add expense'}
            </Text>
            <TextInput label="Description" value={desc} onChangeText={setDesc} mode="outlined" style={styles.input} />
            <TextInput label="Category" value={category} onChangeText={setCategory} mode="outlined" style={styles.input} />
            <TextInput
              label="Amount (UGX)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalButtons}>
              <Button onPress={() => setModalVisible(false)} mode="outlined" style={styles.modalBtn}>
                Cancel
              </Button>
              <Button
                onPress={handleSave}
                loading={creating || updating}
                disabled={creating || updating}
                mode="contained"
                style={styles.modalBtn}
              >
                Save
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { marginBottom: 2 },
  subtitle: {},
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterBtn: { marginRight: 4 },
  chip: { marginRight: 6, marginBottom: 4 },
  searchInput: { marginBottom: 12 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  sortLabel: { marginRight: 8 },
  sortBtn: { marginRight: 4, marginBottom: 4 },
  totalCard: { marginBottom: 16 },
  totalCardContent: { paddingVertical: 16, paddingHorizontal: 20 },
  totalLabel: {},
  totalValue: { fontWeight: '700', marginTop: 4 },
  card: { marginBottom: 12 },
  cardTitle: { marginBottom: 10 },
  cardContent: { paddingVertical: 14, paddingHorizontal: 16 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  empty: { marginTop: 12, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowActions: { flexDirection: 'row' },
  amount: { fontWeight: '600' },
  dateText: { marginTop: 2 },
  muted: { marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, padding: 24 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  errorText: { color: colors.danger, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { minWidth: 100 },
});
