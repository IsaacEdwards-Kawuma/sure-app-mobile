import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { useAssetsQuery, useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation } from '../../src/api/assetsApi';
import { SimpleBarChart } from '../../src/components/SimpleBarChart';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors } from '../../src/theme';
import type { Asset } from '../../src/api/assetsApi';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function AssetsScreen() {
  const { background, surface, textSecondary } = useAppTheme();
  const { spacing } = useResponsive();
  const { data, refetch, isFetching } = useAssetsQuery();
  const [createAsset, { isLoading: creating }] = useCreateAssetMutation();
  const [updateAsset, { isLoading: updating }] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'name'>('value_desc');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const assets = data?.assets ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => { if (a.category) set.add(a.category); });
    return Array.from(set).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    let list = categoryFilter ? assets.filter((a) => (a.category || '') === categoryFilter) : assets;
    list = [...list].sort((a, b) => {
      if (sortBy === 'value_desc') return (b.value ?? 0) - (a.value ?? 0);
      if (sortBy === 'value_asc') return (a.value ?? 0) - (b.value ?? 0);
      return (a.name || '').localeCompare(b.name || '');
    });
    return list;
  }, [assets, categoryFilter, sortBy]);

  const totalValue = filtered.reduce((s, a) => s + (a.value ?? 0), 0);

  const byCategoryChart = useMemo(() => {
    const byCat: Record<string, number> = {};
    assets.forEach((a) => {
      const cat = a.category || 'Other';
      byCat[cat] = (byCat[cat] ?? 0) + (a.value ?? 0);
    });
    return Object.entries(byCat).map(([label, value]) => ({ label, value }));
  }, [assets]);

  const openAdd = () => {
    setEditingAsset(null);
    setName('');
    setCategory('');
    setValue('');
    setStatus('');
    setError(null);
    setModalVisible(true);
  };

  const openEdit = (a: Asset) => {
    setEditingAsset(a);
    setName(a.name || '');
    setCategory(a.category || '');
    setValue(a.value != null ? String(a.value) : '');
    setStatus(a.status || '');
    setError(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const numValue = value ? parseFloat(value) : undefined;
    try {
      if (editingAsset) {
        await updateAsset({
          id: editingAsset.id,
          body: {
            name: name.trim(),
            category: category.trim() || undefined,
            value: numValue,
            status: status.trim() || undefined,
          },
        }).unwrap();
      } else {
        await createAsset({
          name: name.trim(),
          category: category.trim() || undefined,
          value: numValue,
          status: status.trim() || undefined,
        }).unwrap();
      }
      setModalVisible(false);
    } catch (e: unknown) {
      setError((e as { data?: { error?: string } })?.data?.error || 'Failed to save asset');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete asset', 'Remove this asset?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset(id).unwrap();
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
          <Text variant="titleMedium" style={[styles.title, { color: '#ffffff' }]}>Assets</Text>
          <Button mode="contained" onPress={openAdd} compact>Add</Button>
        </View>

        <Text variant="bodyMedium" style={styles.total}>Total value: {totalValue.toLocaleString()} UGX</Text>

        {categories.length > 0 && (
          <View style={styles.filterRow}>
            <Button compact mode={!categoryFilter ? 'contained' : 'outlined'} onPress={() => setCategoryFilter('')} style={styles.filterBtn}>All</Button>
            {categories.map((c) => (
              <Button key={c} compact mode={categoryFilter === c ? 'contained' : 'outlined'} onPress={() => setCategoryFilter(c)} style={styles.filterBtn}>{c}</Button>
            ))}
          </View>
        )}

        <View style={styles.filterRow}>
          <Text variant="labelMedium" style={[styles.sortLabel, { color: textSecondary }]}>Sort: </Text>
          <Button compact mode={sortBy === 'value_desc' ? 'contained' : 'outlined'} onPress={() => setSortBy('value_desc')} style={styles.filterBtn}>Value ↓</Button>
          <Button compact mode={sortBy === 'value_asc' ? 'contained' : 'outlined'} onPress={() => setSortBy('value_asc')} style={styles.filterBtn}>Value ↑</Button>
          <Button compact mode={sortBy === 'name' ? 'contained' : 'outlined'} onPress={() => setSortBy('name')} style={styles.filterBtn}>Name</Button>
        </View>

        {byCategoryChart.length > 0 && (
          <Card style={[styles.card, { backgroundColor: surface }]}>
            <Card.Content>
              <Text variant="titleSmall" style={[styles.cardTitle, { color: '#ffffff' }]}>Value by category</Text>
              <SimpleBarChart data={byCategoryChart} formatValue={(n) => `${Math.round(n).toLocaleString()} UGX`} barHeight={20} />
            </Card.Content>
          </Card>
        )}

        {filtered.length === 0 ? (
          <Text variant="bodyMedium" style={styles.empty}>No assets. Tap Add to register one.</Text>
        ) : (
          filtered.map((a) => (
            <Card key={a.id} style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <Text variant="titleSmall" style={styles.name}>{a.name}</Text>
                  <View style={styles.rowActions}>
                    <Button mode="text" compact onPress={() => openEdit(a)} textColor={colors.accent}>Edit</Button>
                    <Button mode="text" compact onPress={() => handleDelete(a.id)} textColor={colors.danger}>Delete</Button>
                  </View>
                </View>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                  {a.category && `Category: ${a.category}`}
                  {a.value != null && ` · Value: ${a.value.toLocaleString()} UGX`}
                  {a.status && ` · ${a.status}`}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>{editingAsset ? 'Edit Asset' : 'Add Asset'}</Text>
            <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="Category" value={category} onChangeText={setCategory} mode="outlined" style={styles.input} />
            <TextInput
              label="Value (UGX)"
              value={value}
              onChangeText={(t) => setValue(t.replace(/[^0-9.]/g, ''))}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput label="Status" value={status} onChangeText={setStatus} mode="outlined" style={styles.input} />
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
  total: { color: colors.accent, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 },
  filterBtn: { marginRight: 4 },
  sortLabel: { marginRight: 4 },
  card: { marginBottom: 12 },
  cardTitle: { marginBottom: 8 },
  empty: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowActions: { flexDirection: 'row' },
  name: {},
  muted: { marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 12, padding: 20 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  errorText: { color: colors.danger, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { minWidth: 100 },
});
