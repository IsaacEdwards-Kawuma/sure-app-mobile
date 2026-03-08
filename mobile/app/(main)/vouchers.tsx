import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { useVouchersQuery, useGenerateVouchersMutation, useSellVouchersMutation } from '../../src/api/vouchersApi';
import { useSettingsQuery } from '../../src/api/settingsApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors } from '../../src/theme';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function VouchersScreen() {
  const { background, surface, textSecondary } = useAppTheme();
  const { spacing } = useResponsive();
  const { data, refetch, isFetching } = useVouchersQuery();
  const { data: settings } = useSettingsQuery();
  const [generateVouchers, { isLoading: generating }] = useGenerateVouchersMutation();
  const [sellVouchers, { isLoading: selling }] = useSellVouchersMutation();
  const [tab, setTab] = useState<'unused' | 'sold' | 'all'>('unused');
  const [genModalVisible, setGenModalVisible] = useState(false);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [genCount, setGenCount] = useState('10');
  const [genPackageName, setGenPackageName] = useState('');
  const [genPrice, setGenPrice] = useState('');
  const [sellCodes, setSellCodes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const vouchers = data?.vouchers ?? [];
  const filtered =
    tab === 'unused' ? vouchers.filter((v) => v.status === 'unused') : tab === 'sold' ? vouchers.filter((v) => v.status === 'sold') : vouchers;
  const unusedCount = vouchers.filter((v) => v.status === 'unused').length;

  const handleGenerate = async () => {
    setError(null);
    const count = parseInt(genCount, 10);
    if (isNaN(count) || count < 1 || count > 500) {
      setError('Enter count between 1 and 500');
      return;
    }
    try {
      await generateVouchers({
        count,
        package_name: genPackageName.trim() || 'Default',
        price: genPrice ? parseFloat(genPrice) : undefined,
      }).unwrap();
      setGenCount('10');
      setGenPackageName('');
      setGenPrice('');
      setGenModalVisible(false);
    } catch (e: unknown) {
      setError((e as { data?: { error?: string } })?.data?.error || 'Failed to generate');
    }
  };

  const handleSell = async () => {
    setError(null);
    const codes = sellCodes.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean);
    if (codes.length === 0) {
      setError('Enter at least one voucher code');
      return;
    }
    try {
      await sellVouchers({ codes }).unwrap();
      setSellCodes('');
      setSellModalVisible(false);
    } catch (e: unknown) {
      setError((e as { data?: { error?: string } })?.data?.error || 'Failed to sell');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.title, { color: '#ffffff' }]}>Vouchers</Text>
          <View style={styles.headerButtons}>
            <Button mode="outlined" compact onPress={() => setGenModalVisible(true)} style={styles.headerBtn}>Generate</Button>
            <Button mode="contained" compact onPress={() => setSellModalVisible(true)} style={styles.headerBtn}>Sell</Button>
          </View>
        </View>
        <View style={styles.tabs}>
          <Button compact mode={tab === 'unused' ? 'contained' : 'outlined'} onPress={() => setTab('unused')} style={styles.tabBtn}>
            Unused ({unusedCount})
          </Button>
          <Button compact mode={tab === 'sold' ? 'contained' : 'outlined'} onPress={() => setTab('sold')} style={styles.tabBtn}>
            Sold
          </Button>
          <Button compact mode={tab === 'all' ? 'contained' : 'outlined'} onPress={() => setTab('all')} style={styles.tabBtn}>
            All
          </Button>
        </View>
        {filtered.length === 0 ? (
          <Text variant="bodyMedium" style={styles.empty}>
            {tab === 'unused' ? 'No unused vouchers. Generate a batch.' : tab === 'sold' ? 'No sold vouchers yet.' : 'No vouchers.'}
          </Text>
        ) : (
          filtered.slice(0, 100).map((v) => (
            <Card key={v.id} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text variant="titleSmall" style={styles.code}>{v.code}</Text>
                <Text variant="bodySmall" style={styles.muted}>
                  {v.package_name || '—'} · {(v.price ?? 0).toLocaleString()} UGX · {v.status}
                  {v.sold_at && ` · ${v.sold_at.slice(0, 10)}`}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
        {filtered.length > 100 && <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>Showing first 100</Text>}
      </ScrollView>

      <Modal visible={genModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: '#ffffff' }]}>Generate vouchers</Text>
            <TextInput label="Count (1–500)" value={genCount} onChangeText={(t) => setGenCount(t.replace(/\D/g, '').slice(0, 3))} mode="outlined" keyboardType="number-pad" style={styles.input} />
            <TextInput label="Package name" value={genPackageName} onChangeText={setGenPackageName} mode="outlined" style={styles.input} placeholder="Default" />
            <TextInput label="Price (UGX)" value={genPrice} onChangeText={(t) => setGenPrice(t.replace(/[^0-9.]/g, ''))} mode="outlined" keyboardType="decimal-pad" style={styles.input} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalButtons}>
              <Button onPress={() => setGenModalVisible(false)} mode="outlined" style={styles.modalBtn}>Cancel</Button>
              <Button onPress={handleGenerate} loading={generating} disabled={generating} mode="contained" style={styles.modalBtn}>Generate</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={sellModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: '#ffffff' }]}>Sell vouchers</Text>
            <TextInput
              label="Codes (comma or space separated)"
              value={sellCodes}
              onChangeText={setSellCodes}
              mode="outlined"
              style={[styles.input, styles.notes]}
              placeholder="SL-ABC123, SL-DEF456"
              multiline
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalButtons}>
              <Button onPress={() => setSellModalVisible(false)} mode="outlined" style={styles.modalBtn}>Cancel</Button>
              <Button onPress={handleSell} loading={selling} disabled={selling} mode="contained" style={styles.modalBtn}>Mark sold</Button>
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
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerBtn: {},
  tabs: { flexDirection: 'row', marginBottom: 16 },
  tabBtn: { marginRight: 8 },
  empty: {},
  card: { marginBottom: 8 },
  cardContent: { paddingVertical: 8 },
  code: {},
  muted: { marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 12, padding: 20 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  notes: { minHeight: 60 },
  errorText: { color: colors.danger, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { minWidth: 100 },
});
