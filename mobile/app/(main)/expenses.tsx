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
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { useExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } from '../../src/api/expensesApi';
import { useSettingsQuery } from '../../src/api/settingsApi';
import { SimpleBarChart } from '../../src/components/SimpleBarChart';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';
import type { Expense } from '../../src/api/expensesApi';
import { startOfMonth, subMonths, parseISO, isAfter } from 'date-fns';

type DateRange = 'all' | 'this_month' | 'last_month';

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

  const filtered = useMemo(() => {
    return categoryFilter
      ? dateFiltered.filter((e) => (e.category || '').toLowerCase() === categoryFilter.toLowerCase())
      : dateFiltered;
  }, [dateFiltered, categoryFilter]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

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

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.title, { color: textPrimary }]}>Expenses</Text>
          <Button mode="contained" onPress={openAdd} compact>Add</Button>
        </View>

        <View style={styles.filterRow}>
          <Button compact mode={dateRange === 'all' ? 'contained' : 'outlined'} onPress={() => setDateRange('all')} style={styles.filterBtn}>All</Button>
          <Button compact mode={dateRange === 'this_month' ? 'contained' : 'outlined'} onPress={() => setDateRange('this_month')} style={styles.filterBtn}>This month</Button>
          <Button compact mode={dateRange === 'last_month' ? 'contained' : 'outlined'} onPress={() => setDateRange('last_month')} style={styles.filterBtn}>Last month</Button>
        </View>

        {categories.length > 0 && (
          <View style={styles.filterRow}>
            <Button compact mode={!categoryFilter ? 'contained' : 'outlined'} onPress={() => setCategoryFilter('')} style={styles.filterBtn}>All</Button>
            {categories.map((c) => (
              <Button key={c.name} compact mode={categoryFilter === c.name ? 'contained' : 'outlined'} onPress={() => setCategoryFilter(c.name)} style={styles.filterBtn}>{c.name}</Button>
            ))}
          </View>
        )}

        <Text variant="bodyMedium" style={styles.total}>Total: {totalAmount.toLocaleString()} UGX</Text>

        {byCategoryChart.length > 0 && (
          <Card style={[styles.card, { backgroundColor: surface }]}>
            <Card.Content>
              <Text variant="titleSmall" style={[styles.cardTitle, { color: textPrimary }]}>By category ({dateRange === 'all' ? 'all time' : dateRange === 'this_month' ? 'this month' : 'last month'})</Text>
              <SimpleBarChart data={byCategoryChart} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} barHeight={20} />
            </Card.Content>
          </Card>
        )}

        {filtered.length === 0 ? (
          <Text variant="bodyMedium" style={[styles.empty, { color: textSecondary }]}>No expenses. Tap Add to record one.</Text>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} style={[styles.card, { backgroundColor: surface }]}>
              <Card.Content>
                <View style={styles.row}>
                  <Text variant="titleSmall" style={[styles.amount, { color: textPrimary }]}>{(e.amount ?? 0).toLocaleString()} UGX</Text>
                  <View style={styles.rowActions}>
                    <Button mode="text" compact onPress={() => openEdit(e)} textColor={colors.accent}>Edit</Button>
                    <Button mode="text" compact onPress={() => handleDelete(e.id)} textColor={colors.danger}>Delete</Button>
                  </View>
                </View>
                {(e.description || e.category) && (
                  <Text variant="bodySmall" style={styles.muted}>
                    {e.category && `[${e.category}] `}{e.description || ''}
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
            <Text variant="titleLarge" style={[styles.modalTitle, { color: textPrimary }]}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
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
              <Button onPress={() => setModalVisible(false)} mode="outlined" style={styles.modalBtn}>Cancel</Button>
              <Button onPress={handleSave} loading={creating || updating} disabled={creating || updating} mode="contained" style={styles.modalBtn}>Save</Button>
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
  title: {},
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterBtn: { marginRight: 4 },
  total: { color: colors.accent, marginBottom: 12 },
  card: { marginBottom: 12 },
  cardTitle: { marginBottom: 8 },
  empty: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowActions: { flexDirection: 'row' },
  amount: {},
  muted: { marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 12, padding: 20 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  errorText: { color: colors.danger, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { minWidth: 100 },
});
