import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button, TextInput, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVouchersQuery, useGenerateVouchersMutation, useSellVouchersMutation } from '../../src/api/vouchersApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors } from '../../src/theme';
import { useAppTheme } from '../../src/hooks/useAppTheme';

const MAX_DISPLAY = 200;

export default function VouchersScreen() {
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { spacing } = useResponsive();
  const { data, refetch, isFetching } = useVouchersQuery();
  const [generateVouchers, { isLoading: generating }] = useGenerateVouchersMutation();
  const [sellVouchers, { isLoading: selling }] = useSellVouchersMutation();
  const [tab, setTab] = useState<'unused' | 'sold' | 'all'>('unused');
  const [genModalVisible, setGenModalVisible] = useState(false);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genCount, setGenCount] = useState('10');
  const [genPackageName, setGenPackageName] = useState('');
  const [genPrice, setGenPrice] = useState('');
  const [sellCodes, setSellCodes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const vouchers = data?.vouchers ?? [];
  const unusedList = useMemo(() => vouchers.filter((v) => v.status === 'unused'), [vouchers]);
  const soldList = useMemo(() => vouchers.filter((v) => v.status === 'sold'), [vouchers]);
  const soldRevenue = useMemo(
    () => soldList.reduce((sum, v) => sum + (v.price ?? 0), 0),
    [soldList]
  );

  const filteredByTab =
    tab === 'unused' ? unusedList : tab === 'sold' ? soldList : vouchers;
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByTab;
    return filteredByTab.filter((v) => v.code.toLowerCase().includes(q) || (v.package_name || '').toLowerCase().includes(q));
  }, [filteredByTab, searchQuery]);

  const displayed = filtered.slice(0, MAX_DISPLAY);
  const hasMore = filtered.length > MAX_DISPLAY;

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

  const handleShareCode = (code: string) => {
    Share.share({ message: code, title: 'Voucher code' }).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={[styles.title, { color: textPrimary }]}>
            Vouchers
          </Text>
          <View style={styles.headerButtons}>
            <Button mode="outlined" compact onPress={() => setGenModalVisible(true)} style={styles.headerBtn}>
              Generate
            </Button>
            <Button mode="contained" compact onPress={() => setSellModalVisible(true)} style={styles.headerBtn}>
              Sell
            </Button>
          </View>
        </View>

        <View style={[styles.statsRow, { gap: spacing.sm }]}>
          <Card style={[styles.statCard, { backgroundColor: surface }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="bodySmall" style={[styles.statLabel, { color: textSecondary }]}>Unused</Text>
              <Text variant="headlineSmall" style={[styles.statValue, { color: colors.secondary }]}>{unusedList.length}</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: surface }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="bodySmall" style={[styles.statLabel, { color: textSecondary }]}>Sold</Text>
              <Text variant="headlineSmall" style={[styles.statValue, { color: colors.accent }]}>{soldList.length}</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: surface }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="bodySmall" style={[styles.statLabel, { color: textSecondary }]}>Revenue (sold)</Text>
              <Text variant="titleMedium" style={[styles.statValue, { color: colors.success }]} numberOfLines={1}>
                {Math.round(soldRevenue).toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.tabs}>
          <Chip
            selected={tab === 'unused'}
            onPress={() => setTab('unused')}
            style={[styles.chip, tab === 'unused' && { backgroundColor: colors.secondary }]}
            textStyle={{ color: tab === 'unused' ? '#fff' : textSecondary }}
          >
            Unused ({unusedList.length})
          </Chip>
          <Chip
            selected={tab === 'sold'}
            onPress={() => setTab('sold')}
            style={[styles.chip, tab === 'sold' && { backgroundColor: colors.accent }]}
            textStyle={{ color: tab === 'sold' ? '#1a1a2e' : textSecondary }}
          >
            Sold
          </Chip>
          <Chip
            selected={tab === 'all'}
            onPress={() => setTab('all')}
            style={[styles.chip, tab === 'all' && { backgroundColor: colors.primary }]}
            textStyle={{ color: tab === 'all' ? '#fff' : textSecondary }}
          >
            All
          </Chip>
        </View>

        <TextInput
          mode="outlined"
          placeholder="Search by code or package..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={[styles.searchInput, { backgroundColor: surface }]}
          placeholderTextColor={textSecondary}
        />

        {displayed.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="ticket-outline" size={48} color={textSecondary} />
            <Text variant="bodyLarge" style={[styles.empty, { color: textSecondary }]}>
              {searchQuery.trim()
                ? 'No vouchers match your search.'
                : tab === 'unused'
                  ? 'No unused vouchers. Generate a batch.'
                  : tab === 'sold'
                    ? 'No sold vouchers yet.'
                    : 'No vouchers.'}
            </Text>
          </View>
        ) : (
          <>
            {displayed.map((v) => (
              <Card key={v.id} style={[styles.card, { backgroundColor: surface }]}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text variant="titleMedium" style={[styles.code, { color: textPrimary }]} selectable>
                      {v.code}
                    </Text>
                    <TouchableOpacity onPress={() => handleShareCode(v.code)} style={styles.shareBtn}>
                      <MaterialCommunityIcons name="share-variant" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.metaRow}>
                    <Chip compact style={[styles.statusChip, v.status === 'sold' ? styles.statusSold : styles.statusUnused]}>
                      {v.status}
                    </Chip>
                    <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                      {v.package_name || '—'} · {(v.price ?? 0).toLocaleString()} UGX
                      {v.sold_at ? ` · Sold ${v.sold_at.slice(0, 10)}` : ''}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
            {hasMore && (
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary, marginTop: 8 }]}>
                Showing first {MAX_DISPLAY} of {filtered.length}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={genModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: textPrimary }]}>
              Generate vouchers
            </Text>
            <TextInput
              label="Count (1–500)"
              value={genCount}
              onChangeText={(t) => setGenCount(t.replace(/\D/g, '').slice(0, 3))}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
            />
            <TextInput
              label="Package name"
              value={genPackageName}
              onChangeText={setGenPackageName}
              mode="outlined"
              style={styles.input}
              placeholder="Default"
            />
            <TextInput
              label="Price (UGX)"
              value={genPrice}
              onChangeText={(t) => setGenPrice(t.replace(/[^0-9.]/g, ''))}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalButtons}>
              <Button onPress={() => setGenModalVisible(false)} mode="outlined" style={styles.modalBtn}>
                Cancel
              </Button>
              <Button onPress={handleGenerate} loading={generating} disabled={generating} mode="contained" style={styles.modalBtn}>
                Generate
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={sellModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: textPrimary }]}>
              Sell vouchers
            </Text>
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
              <Button onPress={() => setSellModalVisible(false)} mode="outlined" style={styles.modalBtn}>
                Cancel
              </Button>
              <Button onPress={handleSell} loading={selling} disabled={selling} mode="contained" style={styles.modalBtn}>
                Mark sold
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
  title: {},
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerBtn: {},
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  statCard: { flex: 1, minWidth: 90 },
  statContent: { paddingVertical: 12, paddingHorizontal: 12 },
  statLabel: {},
  statValue: { fontWeight: '700', marginTop: 2 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { marginRight: 4 },
  searchInput: { marginBottom: 16 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  empty: { marginTop: 12, textAlign: 'center' },
  card: { marginBottom: 10 },
  cardContent: { paddingVertical: 12, paddingHorizontal: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontFamily: 'monospace' },
  shareBtn: { padding: 4 },
  metaRow: { marginTop: 6 },
  statusChip: { alignSelf: 'flex-start' },
  statusUnused: { backgroundColor: colors.secondary },
  statusSold: { backgroundColor: colors.accent },
  muted: { marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, padding: 24 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  notes: { minHeight: 80 },
  errorText: { color: colors.danger, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { minWidth: 100 },
});
