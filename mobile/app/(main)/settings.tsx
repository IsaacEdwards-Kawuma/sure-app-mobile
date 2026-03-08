import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  TextInput,
  Divider,
  Chip,
  Snackbar,
  IconButton,
  SegmentedButtons,
  Switch,
  List,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/features/auth/store';
import { logout as reduxLogout } from '../../src/features/auth/authSlice';
import { baseApi } from '../../src/api/baseApi';
import { store } from '../../src/store';
import { useThemeStore, THEME_KEY } from '../../src/features/theme/themeStore';
import { useSettingsStore } from '../../src/features/settings/store';
import { useAppPreferencesStore, type AutoLockMinutes } from '../../src/features/appPreferences/store';
import { getApiBaseUrl, getDefaultApiBaseUrl } from '../../src/config/apiUrl';
import { api } from '../../src/services/api';
import { getStoredToken } from '../../src/services/api';
import type {
  BusinessSettings,
  RevenueSource,
  VoucherPackage,
  FixedCost,
  ExpenseCategory,
  Subscription,
  UserListItem,
} from '../../src/features/settings/types';
import { uid } from '../../src/features/settings/types';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';

const SUB_TABS = [
  { key: 'general', label: 'General', icon: 'cog' },
  { key: 'business', label: 'Business', icon: 'domain' },
  { key: 'users', label: 'Users', icon: 'account-group' },
  { key: 'revenue', label: 'Revenue', icon: 'cash' },
  { key: 'packages', label: 'Packages', icon: 'ticket-percent' },
  { key: 'fixed', label: 'Fixed Costs', icon: 'clipboard-list' },
  { key: 'expense', label: 'Exp. Categories', icon: 'folder' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'bell' },
  { key: 'adminlog', label: 'Admin Log', icon: 'history' },
  { key: 'security', label: 'Security', icon: 'shield-lock' },
  { key: 'biometrics', label: 'Biometrics', icon: 'fingerprint' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-badge' },
  { key: 'warnings', label: 'Warnings', icon: 'alert-circle' },
];

const NOTIFICATIONS_KEY = '@surelink_notifications';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';


export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { spacing, width, height } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const logoutZustand = useAuthStore((s) => s.logout);
  const [activeTab, setActiveTab] = useState('general');
  const [snack, setSnack] = useState('');
  const [downloading, setDownloading] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const panelMaxHeight = Math.max(280, Math.min(500, height * 0.55));
  const isNarrow = width < 480;

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((v) => { setNotificationsOn(v !== 'false'); });
  }, []);

  const {
    business,
    revenue_sources,
    voucher_packages,
    fixed_costs,
    expense_categories,
    subscriptions,
    users,
    adminLog,
    loading,
    error,
    fetchSettings,
    fetchUsers,
    fetchAdminLog,
    saveBusiness,
    saveRevenueSources,
    saveVoucherPackages,
    saveFixedCosts,
    saveExpenseCategories,
    saveSubscriptions,
    clearAdminLog,
    setSettings,
    setUsers,
    setAdminLog,
    clearError,
  } = useSettingsStore();

  const hydratePrefs = useAppPreferencesStore((s) => s.hydrate);
  useEffect(() => {
    hydratePrefs();
  }, [hydratePrefs]);

  useEffect(() => {
    if (user?.permissions === 'all') {
      fetchSettings();
      fetchUsers();
      fetchAdminLog();
    }
  }, [user?.permissions]);

  const refresh = () => {
    fetchSettings();
    fetchUsers();
    fetchAdminLog();
  };

  const showSnack = (msg: string) => setSnack(msg);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const token = await getStoredToken();
      const apiBase = await getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/backup/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const text = await res.text();
      const filename = `wifi-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      await Share.share({
        message: text,
        title: filename,
      });
      showSnack('Backup ready to share');
    } catch (e) {
      showSnack('Backup download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = async () => {
    store.dispatch(baseApi.util.resetApiState());
    dispatch(reduxLogout());
    await logoutZustand();
    router.replace('/login');
  };

  const handleThemeChange = async (value: 'dark' | 'light') => {
    await setThemeMode(value);
    showSnack('Theme updated');
  };

  const handleNotificationsChange = async (value: boolean) => {
    setNotificationsOn(value);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, value ? 'true' : 'false');
    showSnack(value ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleClearCache = () => {
    Alert.alert('Clear cache', 'Clear locally stored app data (e.g. preferences)? You will stay logged in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', onPress: async () => {
        await AsyncStorage.multiRemove([THEME_KEY, NOTIFICATIONS_KEY]);
        await setThemeMode('dark');
        setNotificationsOn(true);
        showSnack('Cache cleared');
      } },
    ]);
  };

  const { background, surface, textPrimary, textSecondary, borderSubtle } = useAppTheme();
  const isAdmin = user != null && user.permissions === 'all';
  const panelMinHeight = 280;

  if (!isAdmin) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: background }]}
        contentContainerStyle={[styles.settingsScrollContent, { padding: spacing.screenHorizontal, paddingBottom: 24 }]}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={[styles.settingsTitle, { color: textPrimary }]}>Settings</Text>
            <Divider style={styles.divider} />
            <ScrollView style={[styles.panel, { maxHeight: panelMaxHeight, minHeight: panelMinHeight }]}>
              <GeneralPanel
                themeMode={themeMode}
                onThemeChange={handleThemeChange}
                notificationsOn={notificationsOn}
                onNotificationsChange={handleNotificationsChange}
                onClearCache={handleClearCache}
                onSnack={showSnack}
                appVersion={APP_VERSION}
                onOpenUser={() => router.push('/(main)/user')}
                onOpenGuide={() => router.push('/(main)/guide')}
              />
            </ScrollView>
          </Card.Content>
        </Card>
        <Button mode="outlined" onPress={handleLogout} style={styles.logout}>Sign Out</Button>
        <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>{snack}</Snackbar>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.settingsScrollContent, { padding: spacing.screenHorizontal, paddingBottom: 24 }]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={[styles.header, isNarrow && styles.headerColumn]}>
            <Text variant="titleLarge" style={[styles.settingsTitle, { color: textPrimary }]}>Settings</Text>
            <Button
              mode="outlined"
              compact
              onPress={handleDownloadBackup}
              disabled={downloading}
              icon={downloading ? () => <ActivityIndicator size="small" /> : 'download'}
            >
              {downloading ? '…' : 'Download Backup'}
            </Button>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabRow}
            contentContainerStyle={[styles.tabRowContent, isNarrow && { paddingVertical: 8 }]}
          >
            {SUB_TABS.map((t) => (
              <Chip
                key={t.key}
                selected={activeTab === t.key}
                onPress={() => setActiveTab(t.key)}
                style={styles.tabChip}
                icon={() => <MaterialCommunityIcons name={t.icon as any} size={18} color="#94a3b8" />}
              >
                {t.label}
              </Chip>
            ))}
          </ScrollView>

          <Divider style={styles.divider} />

          <ScrollView
            style={[styles.panel, { maxHeight: panelMaxHeight, minHeight: panelMinHeight }]}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          >
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {activeTab === 'general' && (
              <GeneralPanel
                themeMode={themeMode}
                onThemeChange={handleThemeChange}
                notificationsOn={notificationsOn}
                onNotificationsChange={handleNotificationsChange}
                onClearCache={handleClearCache}
                onSnack={showSnack}
                appVersion={APP_VERSION}
                onOpenUser={() => router.push('/(main)/user')}
                onOpenGuide={() => router.push('/(main)/guide')}
              />
            )}
            {activeTab === 'business' && (
              <BusinessPanel business={business} onSave={saveBusiness} onSnack={showSnack} />
            )}
            {activeTab === 'users' && (
              <UsersPanel users={users} onRefresh={fetchUsers} onSnack={showSnack} setUsers={setUsers} />
            )}
            {activeTab === 'revenue' && (
              <RevenuePanel list={revenue_sources} onSave={saveRevenueSources} onSnack={showSnack} setSettings={setSettings} />
            )}
            {activeTab === 'packages' && (
              <PackagesPanel list={voucher_packages} onSave={saveVoucherPackages} onSnack={showSnack} setSettings={setSettings} />
            )}
            {activeTab === 'fixed' && (
              <FixedCostsPanel list={fixed_costs} onSave={saveFixedCosts} onSnack={showSnack} setSettings={setSettings} />
            )}
            {activeTab === 'expense' && (
              <ExpenseCategoriesPanel list={expense_categories} onSave={saveExpenseCategories} onSnack={showSnack} setSettings={setSettings} />
            )}
            {activeTab === 'subscriptions' && (
              <SubscriptionsPanel list={subscriptions} onSave={saveSubscriptions} onSnack={showSnack} setSettings={setSettings} />
            )}
            {activeTab === 'adminlog' && (
              <AdminLogPanel entries={adminLog} onClear={clearAdminLog} onRefresh={fetchAdminLog} setAdminLog={setAdminLog} onSnack={showSnack} />
            )}
            {activeTab === 'security' && <SecurityPanel onSnack={showSnack} />}
            {activeTab === 'biometrics' && <BiometricsPanel onSnack={showSnack} />}
            {activeTab === 'notifications' && <NotificationsPanel onSnack={showSnack} />}
            {activeTab === 'warnings' && <WarningsPanel onSnack={showSnack} />}
            {!['general', 'business', 'users', 'revenue', 'packages', 'fixed', 'expense', 'subscriptions', 'adminlog', 'security', 'biometrics', 'notifications', 'warnings'].includes(activeTab) && (
              <Text style={[styles.muted, { color: textSecondary }]}>Select a section above.</Text>
            )}
          </ScrollView>
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={handleLogout} style={styles.logout}>
        Sign Out
      </Button>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={3000}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

// --- General (all users) ---
function GeneralPanel({
  themeMode,
  onThemeChange,
  notificationsOn,
  onNotificationsChange,
  onClearCache,
  onSnack,
  appVersion,
  onOpenUser,
  onOpenGuide,
}: {
  themeMode: 'dark' | 'light';
  onThemeChange: (v: 'dark' | 'light') => void;
  notificationsOn: boolean;
  onNotificationsChange: (v: boolean) => void;
  onClearCache: () => void;
  onSnack: (m: string) => void;
  appVersion: string;
  onOpenUser: () => void;
  onOpenGuide: () => void;
}) {
  const { textPrimary, textSecondary } = useAppTheme();
  const autoLockMinutes = useAppPreferencesStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useAppPreferencesStore((s) => s.setAutoLockMinutes);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const biometricsEnabled = useAppPreferencesStore((s) => s.biometricsEnabled);
  const setBiometricsEnabled = useAppPreferencesStore((s) => s.setBiometricsEnabled);
  const notificationSubscriptionAlerts = useAppPreferencesStore((s) => s.notificationSubscriptionAlerts);
  const notificationDailyReminder = useAppPreferencesStore((s) => s.notificationDailyReminder);
  const notificationRevenueAlert = useAppPreferencesStore((s) => s.notificationRevenueAlert);
  const setNotificationSubscriptionAlerts = useAppPreferencesStore((s) => s.setNotificationSubscriptionAlerts);
  const setNotificationDailyReminder = useAppPreferencesStore((s) => s.setNotificationDailyReminder);
  const setNotificationRevenueAlert = useAppPreferencesStore((s) => s.setNotificationRevenueAlert);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { hasHardwareAsync } = await import('expo-local-authentication');
        const hasHardware = await hasHardwareAsync();
        if (!cancelled) setBiometricSupported(hasHardware);
      } catch {
        if (!cancelled) setBiometricSupported(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.panelInner}>
      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>Appearance</Text>
      <View style={styles.settingRow}>
        <Text variant="bodyLarge" style={[styles.settingLabel, { color: textPrimary }]}>Theme</Text>
        <SegmentedButtons
          value={themeMode}
          onValueChange={(v) => v && (v === 'dark' || v === 'light') && onThemeChange(v)}
          buttons={[
            { value: 'dark', label: 'Dark', icon: 'theme-light-dark' },
            { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
          ]}
          style={styles.segmented}
        />
      </View>

      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>Security & lock</Text>
      <Text variant="bodySmall" style={[styles.muted, { color: textSecondary, marginBottom: 6 }]}>Auto-logout when app is in background</Text>
      <SegmentedButtons
        buttons={[
          { value: '0', label: 'Never' },
          { value: '1', label: '1 min' },
          { value: '5', label: '5 min' },
          { value: '15', label: '15 min' },
          { value: '30', label: '30 min' },
        ]}
        value={String(autoLockMinutes)}
        onValueChange={(v) => { setAutoLockMinutes(Number(v) as AutoLockMinutes); onSnack('Auto-lock updated'); }}
        style={styles.segmented}
      />
      {biometricSupported === true && (
        <List.Item
          title="Biometrics"
          description="Unlock with fingerprint or face"
          right={() => <Switch value={biometricsEnabled} onValueChange={(v) => { setBiometricsEnabled(v); onSnack(v ? 'Biometrics enabled' : 'Biometrics disabled'); }} />}
          style={styles.listItemSetting}
        />
      )}

      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>Reminders & alerts</Text>
      <List.Item
        title="Subscription due alerts"
        description="Remind when subscriptions are due"
        right={() => <Switch value={notificationSubscriptionAlerts} onValueChange={(v) => { setNotificationSubscriptionAlerts(v); onSnack('Saved'); }} />}
        style={styles.listItemSetting}
      />
      <List.Item
        title="Daily reminder"
        description="Daily summary or reminder"
        right={() => <Switch value={notificationDailyReminder} onValueChange={(v) => { setNotificationDailyReminder(v); onSnack('Saved'); }} />}
        style={styles.listItemSetting}
      />
      <List.Item
        title="Revenue below threshold"
        description="Alert when daily revenue is low"
        right={() => <Switch value={notificationRevenueAlert} onValueChange={(v) => { setNotificationRevenueAlert(v); onSnack('Saved'); }} />}
        style={styles.listItemSetting}
      />

      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>Preferences</Text>
      <List.Item
        title="Notifications"
        description={notificationsOn ? 'Enabled' : 'Disabled'}
        right={() => <Switch value={notificationsOn} onValueChange={onNotificationsChange} />}
        style={styles.listItemSetting}
      />
      <List.Item
        title="Currency"
        description="UGX"
        left={(props) => <List.Icon {...props} icon="currency-usd" />}
        style={styles.listItemSetting}
      />

      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>Account & help</Text>
      <List.Item
        title="User options"
        description="Profile, PIN, guide, log out"
        left={(props) => <List.Icon {...props} icon="account-cog" />}
        onPress={onOpenUser}
        style={styles.listItemSetting}
      />
      <List.Item
        title="In-app guide"
        description="How to use the app"
        left={(props) => <List.Icon {...props} icon="book-open-page-variant" />}
        onPress={onOpenGuide}
        style={styles.listItemSetting}
      />

      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>Data & storage</Text>
      <List.Item
        title="Clear cache"
        description="Reset theme & notification preferences"
        left={(props) => <List.Icon {...props} icon="broom" />}
        onPress={onClearCache}
        style={styles.listItemSetting}
      />

      <Text variant="titleMedium" style={[styles.generalSection, { color: textSecondary }]}>About</Text>
      <List.Item
        title="SureLink WiFi Manager"
        description={`Version ${appVersion}. Default server: ${getDefaultApiBaseUrl()}`}
        left={(props) => <List.Icon {...props} icon="information-outline" />}
        style={styles.listItemSetting}
      />
    </View>
  );
}

// --- Business ---
function BusinessPanel({
  business,
  onSave,
  onSnack,
}: {
  business: BusinessSettings;
  onSave: (b: BusinessSettings) => Promise<void>;
  onSnack: (m: string) => void;
}) {
  const [name, setName] = useState(business.name);
  const [tagline, setTagline] = useState(business.tagline);
  const [owner, setOwner] = useState(business.owner);
  const [phone, setPhone] = useState(business.phone);
  const [addr, setAddr] = useState(business.addr);
  useEffect(() => {
    setName(business.name);
    setTagline(business.tagline);
    setOwner(business.owner);
    setPhone(business.phone);
    setAddr(business.addr);
  }, [business]);

  const save = async () => {
    await onSave({ name, tagline, owner, phone, addr });
    onSnack('Business settings saved');
  };

  return (
    <View style={styles.panelInner}>
      <TextInput label="Business Name" value={name} onChangeText={setName} mode="outlined" style={styles.input} placeholder="My WiFi Business" />
      <TextInput label="Tagline" value={tagline} onChangeText={setTagline} mode="outlined" style={styles.input} placeholder="Fast. Reliable. Affordable." />
      <TextInput label="Owner Name" value={owner} onChangeText={setOwner} mode="outlined" style={styles.input} placeholder="Your full name" />
      <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} placeholder="+256…" keyboardType="phone-pad" />
      <TextInput label="Location / Address" value={addr} onChangeText={setAddr} mode="outlined" style={styles.input} placeholder="e.g. Kabira, Kampala" />
      <Button mode="contained" onPress={save} style={styles.primaryBtn}>Save Business Settings</Button>
    </View>
  );
}

// --- Admin Log ---
function AdminLogPanel({
  entries,
  onClear,
  onRefresh,
  setAdminLog,
  onSnack,
}: {
  entries: { id: number; action: string; details: unknown; user_name: string | null; created_at: string }[];
  onClear: () => Promise<void>;
  onRefresh: () => void;
  setAdminLog: (a: any[]) => void;
  onSnack: (m: string) => void;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  const clear = () => {
    Alert.alert('Clear Log', 'Clear all admin log entries? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await onClear();
          setAdminLog([]);
          onSnack('Log cleared');
        },
      },
    ]);
  };

  const formatDate = (d: string) => {
    const x = new Date(d);
    return x.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Admin Activity Log</Text>
        <Button mode="outlined" compact onPress={clear}>Clear Log</Button>
      </View>
      <View style={styles.logList}>
        {entries.slice(0, 300).map((e) => (
          <View key={e.id} style={[styles.logRow, { borderBottomColor: borderSubtle }]}>
            <Text style={[styles.logTime, { color: textSecondary }]}>{formatDate(e.created_at)}</Text>
            <Text style={styles.logUser}>{e.user_name ?? '—'}</Text>
            <Text style={styles.logAction}>{e.action}</Text>
            <Text style={[styles.logDetail, { color: textSecondary }]} numberOfLines={1}>
              {e.details && typeof e.details === 'object' && 'key' in (e.details as object)
                ? String((e.details as { key?: string }).key)
                : typeof e.details === 'string'
                  ? e.details
                  : JSON.stringify(e.details ?? '')}
            </Text>
          </View>
        ))}
        {entries.length === 0 && <Text style={[styles.muted, { color: textSecondary }]}>No log entries.</Text>}
      </View>
    </View>
  );
}

// --- Fixed Costs ---
function FixedCostsPanel({
  list,
  onSave,
  onSnack,
  setSettings,
}: {
  list: FixedCost[];
  onSave: (f: FixedCost[]) => Promise<void>;
  onSnack: (m: string) => void;
  setSettings: (s: any) => void;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  const [modal, setModal] = useState<{ open: boolean; item?: FixedCost }>({ open: false });

  const monthlyTotal = list
    .filter((c) => c.active)
    .reduce((sum, c) => {
      if (c.freq === 'monthly') return sum + (c.amount || 0);
      if (c.freq === 'quarterly') return sum + Math.round((c.amount || 0) / 3);
      if (c.freq === 'annual') return sum + Math.round((c.amount || 0) / 12);
      return sum;
    }, 0);
  const breakEven = Math.round(monthlyTotal / 30);

  const add = () => setModal({ open: true });
  const edit = (item: FixedCost) => setModal({ open: true, item });
  const remove = (id: string) => {
    Alert.alert('Delete', 'Delete this cost?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = list.filter((x) => x.id !== id);
          await onSave(next);
          setSettings({ fixed_costs: next });
          onSnack('Deleted');
        },
      },
    ]);
  };
  const toggle = async (id: string) => {
    const next = list.map((x) => (x.id === id ? { ...x, active: !x.active } : x));
    await onSave(next);
    setSettings({ fixed_costs: next });
    onSnack('Updated');
  };

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Fixed & Recurring Costs</Text>
        <Button mode="contained" onPress={add} compact>+ Add Cost</Button>
      </View>
      {list.map((c) => (
        <View key={c.id} style={[styles.listItem, { borderBottomColor: borderSubtle }]}>
          <View style={styles.listItemInfo}>
            <Text variant="titleSmall">{c.name} {c.active ? <Chip compact style={styles.badgeGreen}>Active</Chip> : <Chip compact style={styles.badgeGray}>Off</Chip>}</Text>
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>{c.amount} UGX / {c.freq}{c.note ? ` · ${c.note}` : ''}</Text>
          </View>
          <View style={styles.listItemActions}>
            <IconButton icon="pencil" size={20} onPress={() => edit(c)} />
            <Button compact onPress={() => toggle(c.id)}>{c.active ? 'Disable' : 'Enable'}</Button>
            <IconButton icon="delete" size={20} onPress={() => remove(c.id)} />
          </View>
        </View>
      ))}
      <View style={styles.totalBar}>
        <Text variant="titleSmall" style={{ color: '#fff' }}>Monthly Total: {monthlyTotal.toLocaleString()} UGX | Break-Even: {breakEven.toLocaleString()} UGX/day</Text>
      </View>
      <FixedCostModal
        visible={modal.open}
        item={modal.item}
        onDismiss={() => setModal({ open: false })}
        onSave={async (item) => {
          const next = modal.item
            ? list.map((x) => (x.id === modal.item!.id ? { ...item, id: x.id } : x))
            : [...list, { ...item, id: uid(), active: true }];
          await onSave(next);
          setSettings({ fixed_costs: next });
          setModal({ open: false });
          onSnack('Saved');
        }}
      />
    </View>
  );
}

function FixedCostModal({
  visible,
  item,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  item?: FixedCost;
  onDismiss: () => void;
  onSave: (v: Omit<FixedCost, 'id'> & { id?: string }) => Promise<void>;
}) {
  const { surface } = useAppTheme();
  const [name, setName] = useState(item?.name ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [freq, setFreq] = useState<FixedCost['freq']>(item?.freq ?? 'monthly');
  const [note, setNote] = useState(item?.note ?? '');
  useEffect(() => {
    setName(item?.name ?? '');
    setAmount(String(item?.amount ?? ''));
    setFreq(item?.freq ?? 'monthly');
    setNote(item?.note ?? '');
  }, [item, visible]);

  const save = () => {
    if (!name.trim()) return;
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 0) return;
    onSave({ name: name.trim(), amount: amt, freq, note: note.trim() || undefined, active: item?.active ?? true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: surface }]}>
          <Text variant="titleMedium">{item ? 'Edit Cost' : 'Add Cost'}</Text>
          <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Amount (UGX) *" value={amount} onChangeText={setAmount} keyboardType="number-pad" mode="outlined" style={styles.input} />
          <SegmentedButtons
            buttons={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'annual', label: 'Annual' },
            ]}
            value={freq}
            onValueChange={(v) => setFreq(v as FixedCost['freq'])}
            style={styles.segmented}
          />
          <TextInput label="Note" value={note} onChangeText={setNote} mode="outlined" style={styles.input} />
          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={save}>Save</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Revenue Sources ---
function RevenuePanel({
  list,
  onSave,
  onSnack,
  setSettings,
}: {
  list: RevenueSource[];
  onSave: (r: RevenueSource[]) => Promise<void>;
  onSnack: (m: string) => void;
  setSettings: (s: any) => void;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  const [modal, setModal] = useState<{ open: boolean; item?: RevenueSource }>({ open: false });

  const add = () => setModal({ open: true });
  const edit = (item: RevenueSource) => setModal({ open: true, item });
  const remove = (id: string) => {
    Alert.alert('Delete', 'Delete this revenue source?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = list.filter((x) => x.id !== id);
          await onSave(next);
          setSettings({ revenue_sources: next });
          onSnack('Deleted');
        },
      },
    ]);
  };
  const toggle = async (id: string) => {
    const next = list.map((x) => (x.id === id ? { ...x, active: !x.active } : x));
    await onSave(next);
    setSettings({ revenue_sources: next });
    onSnack('Updated');
  };

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Revenue Sources</Text>
        <Button mode="contained" onPress={add} compact>+ Add Source</Button>
      </View>
      {list.map((r) => (
        <View key={r.id} style={[styles.listItem, { borderBottomColor: borderSubtle }]}>
          <View style={styles.listItemInfo}>
            <Text variant="titleSmall">{r.name} {r.active ? <Chip compact style={styles.badgeGreen}>Active</Chip> : <Chip compact style={styles.badgeGray}>Off</Chip>}</Text>
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>{r.inputType === 'count' ? `count | ${r.price ?? 0} UGX/unit` : 'direct amount'}</Text>
          </View>
          <View style={styles.listItemActions}>
            <IconButton icon="pencil" size={20} onPress={() => edit(r)} />
            <Button compact onPress={() => toggle(r.id)}>{r.active ? 'Disable' : 'Enable'}</Button>
            <IconButton icon="delete" size={20} onPress={() => remove(r.id)} />
          </View>
        </View>
      ))}
      <RevenueModal
        visible={modal.open}
        item={modal.item}
        onDismiss={() => setModal({ open: false })}
        onSave={async (item) => {
          const next = modal.item
            ? list.map((x) => (x.id === modal.item!.id ? { ...item, id: x.id } : x))
            : [...list, { ...item, id: uid(), active: true }];
          await onSave(next);
          setSettings({ revenue_sources: next });
          setModal({ open: false });
          onSnack('Saved');
        }}
      />
    </View>
  );
}

function RevenueModal({
  visible,
  item,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  item?: RevenueSource;
  onDismiss: () => void;
  onSave: (v: Omit<RevenueSource, 'id'> & { id?: string }) => Promise<void>;
}) {
  const { surface } = useAppTheme();
  const [name, setName] = useState(item?.name ?? '');
  const [key, setKey] = useState(item?.key ?? '');
  const [inputType, setInputType] = useState<'direct' | 'count'>(item?.inputType ?? 'direct');
  const [price, setPrice] = useState(String(item?.price ?? ''));
  useEffect(() => {
    setName(item?.name ?? '');
    setKey(item?.key ?? '');
    setInputType(item?.inputType ?? 'direct');
    setPrice(String(item?.price ?? ''));
  }, [item, visible]);

  const save = () => {
    if (!name.trim() || !key.trim()) return;
    const k = key.toLowerCase().replace(/\s/g, '');
    const p = inputType === 'count' ? parseInt(price, 10) : undefined;
    if (inputType === 'count' && (isNaN(p!) || p! < 0)) return;
    onSave({ name: name.trim(), key: k, inputType, price: p, active: item?.active ?? true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: surface }]}>
          <Text variant="titleMedium">{item ? 'Edit Source' : 'Add Source'}</Text>
          <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Key * (lowercase, no spaces)" value={key} onChangeText={setKey} mode="outlined" style={styles.input} autoCapitalize="none" />
          <SegmentedButtons
            buttons={[{ value: 'direct', label: 'Direct amount' }, { value: 'count', label: 'Count per unit' }]}
            value={inputType}
            onValueChange={(v) => setInputType(v as 'direct' | 'count')}
            style={styles.segmented}
          />
          {inputType === 'count' && (
            <TextInput label="Unit Price (UGX)" value={price} onChangeText={setPrice} keyboardType="number-pad" mode="outlined" style={styles.input} />
          )}
          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={save}>Save</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Voucher Packages ---
function PackagesPanel({
  list,
  onSave,
  onSnack,
  setSettings,
}: {
  list: VoucherPackage[];
  onSave: (v: VoucherPackage[]) => Promise<void>;
  onSnack: (m: string) => void;
  setSettings: (s: any) => void;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  const [modal, setModal] = useState<{ open: boolean; item?: VoucherPackage }>({ open: false });

  const add = () => setModal({ open: true });
  const edit = (item: VoucherPackage) => setModal({ open: true, item });
  const remove = (id: string) => {
    Alert.alert('Delete', 'Delete this package?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = list.filter((x) => x.id !== id);
          await onSave(next);
          setSettings({ voucher_packages: next });
          onSnack('Deleted');
        },
      },
    ]);
  };
  const toggle = async (id: string) => {
    const next = list.map((x) => (x.id === id ? { ...x, active: !x.active } : x));
    await onSave(next);
    setSettings({ voucher_packages: next });
    onSnack('Updated');
  };

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Voucher Packages</Text>
        <Button mode="contained" onPress={add} compact>+ Add Package</Button>
      </View>
      {list.map((p) => (
        <View key={p.id} style={[styles.listItem, { borderBottomColor: borderSubtle }]}>
          <View style={styles.listItemInfo}>
            <Text variant="titleSmall">{p.name} {p.active ? <Chip compact style={styles.badgeGreen}>Active</Chip> : <Chip compact style={styles.badgeGray}>Off</Chip>}</Text>
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>{p.price} UGX | {p.duration} {p.durUnit}</Text>
          </View>
          <View style={styles.listItemActions}>
            <IconButton icon="pencil" size={20} onPress={() => edit(p)} />
            <Button compact onPress={() => toggle(p.id)}>{p.active ? 'Disable' : 'Enable'}</Button>
            <IconButton icon="delete" size={20} onPress={() => remove(p.id)} />
          </View>
        </View>
      ))}
      <PackageModal
        visible={modal.open}
        item={modal.item}
        onDismiss={() => setModal({ open: false })}
        onSave={async (item) => {
          const next = modal.item
            ? list.map((x) => (x.id === modal.item!.id ? { ...item, id: x.id } : x))
            : [...list, { ...item, id: uid(), active: true }];
          await onSave(next);
          setSettings({ voucher_packages: next });
          setModal({ open: false });
          onSnack('Saved');
        }}
      />
    </View>
  );
}

function PackageModal({
  visible,
  item,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  item?: VoucherPackage;
  onDismiss: () => void;
  onSave: (v: Omit<VoucherPackage, 'id'> & { id?: string }) => Promise<void>;
}) {
  const { surface } = useAppTheme();
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(String(item?.price ?? ''));
  const [duration, setDuration] = useState(String(item?.duration ?? ''));
  const [durUnit, setDurUnit] = useState<'Hours' | 'Days'>(item?.durUnit ?? 'Hours');
  useEffect(() => {
    setName(item?.name ?? '');
    setPrice(String(item?.price ?? ''));
    setDuration(String(item?.duration ?? ''));
    setDurUnit(item?.durUnit ?? 'Hours');
  }, [item, visible]);

  const save = () => {
    if (!name.trim()) return;
    const p = parseInt(price, 10);
    const d = parseInt(duration, 10);
    if (isNaN(p) || p < 0 || isNaN(d) || d < 0) return;
    onSave({ name: name.trim(), price: p, duration: d, durUnit, active: item?.active ?? true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: surface }]}>
          <Text variant="titleMedium">{item ? 'Edit Package' : 'Add Package'}</Text>
          <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Price (UGX) *" value={price} onChangeText={setPrice} keyboardType="number-pad" mode="outlined" style={styles.input} />
          <TextInput label="Duration" value={duration} onChangeText={setDuration} keyboardType="number-pad" mode="outlined" style={styles.input} />
          <SegmentedButtons
            buttons={[{ value: 'Hours', label: 'Hours' }, { value: 'Days', label: 'Days' }]}
            value={durUnit}
            onValueChange={(v) => setDurUnit(v as 'Hours' | 'Days')}
            style={styles.segmented}
          />
          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={save}>Save</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Expense Categories ---
function ExpenseCategoriesPanel({
  list,
  onSave,
  onSnack,
  setSettings,
}: {
  list: ExpenseCategory[];
  onSave: (e: ExpenseCategory[]) => Promise<void>;
  onSnack: (m: string) => void;
  setSettings: (s: any) => void;
}) {
  const { borderSubtle } = useAppTheme();
  const [modal, setModal] = useState<{ open: boolean; item?: ExpenseCategory }>({ open: false });
  const [subModal, setSubModal] = useState<{ open: boolean; categoryId: string }>({ open: false, categoryId: '' });

  const add = () => setModal({ open: true });
  const edit = (item: ExpenseCategory) => setModal({ open: true, item });
  const addSub = (catId: string) => setSubModal({ open: true, categoryId: catId });
  const removeSub = async (catId: string, subIndex: number) => {
    const cat = list.find((c) => c.id === catId);
    if (!cat) return;
    const subs = cat.subs.filter((_, i) => i !== subIndex);
    const next = list.map((c) => (c.id === catId ? { ...c, subs } : c));
    await onSave(next);
    setSettings({ expense_categories: next });
    onSnack('Subcategory removed');
  };
  const remove = (id: string) => {
    Alert.alert('Delete', 'Delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = list.filter((x) => x.id !== id);
          await onSave(next);
          setSettings({ expense_categories: next });
          onSnack('Deleted');
        },
      },
    ]);
  };
  const toggle = async (id: string) => {
    const next = list.map((x) => (x.id === id ? { ...x, active: !x.active } : x));
    await onSave(next);
    setSettings({ expense_categories: next });
    onSnack('Updated');
  };

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Expense Categories</Text>
        <Button mode="contained" onPress={add} compact>+ Add Category</Button>
      </View>
      {list.map((c) => (
        <View key={c.id} style={[styles.listItem, { borderBottomColor: borderSubtle }]}>
          <View style={styles.listItemInfo}>
            <Text variant="titleSmall">{c.name} {c.active ? <Chip compact style={styles.badgeGreen}>Active</Chip> : <Chip compact style={styles.badgeGray}>Off</Chip>} · {c.subs.length} sub(s)</Text>
            <View style={styles.chipRow}>
              {c.subs.map((s, i) => (
                <Chip key={i} onClose={() => removeSub(c.id, i)} style={styles.subChip}>{s}</Chip>
              ))}
            </View>
          </View>
          <View style={styles.listItemActions}>
            <Button compact onPress={() => addSub(c.id)}>+ Sub</Button>
            <IconButton icon="pencil" size={20} onPress={() => edit(c)} />
            <Button compact onPress={() => toggle(c.id)}>{c.active ? 'Off' : 'Enable'}</Button>
            <IconButton icon="delete" size={20} onPress={() => remove(c.id)} />
          </View>
        </View>
      ))}
      <ExpenseCategoryModal
        visible={modal.open}
        item={modal.item}
        onDismiss={() => setModal({ open: false })}
        onSave={async (item) => {
          const next = modal.item
            ? list.map((x) => (x.id === modal.item!.id ? { ...item, id: x.id, subs: item.subs ?? x.subs } : x))
            : [...list, { ...item, id: uid(), subs: item.subs ?? [], active: true }];
          await onSave(next);
          setSettings({ expense_categories: next });
          setModal({ open: false });
          onSnack('Saved');
        }}
      />
      <SubcategoryModal
        visible={subModal.open}
        categoryId={subModal.categoryId}
        categories={list}
        onDismiss={() => setSubModal({ open: false, categoryId: '' })}
        onSave={onSave}
        setSettings={setSettings}
        onSnack={onSnack}
      />
    </View>
  );
}

function ExpenseCategoryModal({
  visible,
  item,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  item?: ExpenseCategory;
  onDismiss: () => void;
  onSave: (v: Omit<ExpenseCategory, 'id'> & { id?: string }) => Promise<void>;
}) {
  const { surface } = useAppTheme();
  const [name, setName] = useState(item?.name ?? '');
  const [subsStr, setSubsStr] = useState(item?.subs?.join(', ') ?? '');
  useEffect(() => {
    setName(item?.name ?? '');
    setSubsStr(item?.subs?.join(', ') ?? '');
  }, [item, visible]);

  const save = () => {
    if (!name.trim()) return;
    const subs = subsStr.split(',').map((s) => s.trim()).filter(Boolean);
    onSave({ name: name.trim(), subs, active: item?.active ?? true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: surface }]}>
          <Text variant="titleMedium">{item ? 'Edit Category' : 'Add Category'}</Text>
          <TextInput label="Category Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Subcategories (comma-separated)" value={subsStr} onChangeText={setSubsStr} mode="outlined" style={styles.input} placeholder="Rent, Insurance, Salaries" />
          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={save}>Save</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SubcategoryModal({
  visible,
  categoryId,
  categories,
  onDismiss,
  onSave,
  setSettings,
  onSnack,
}: {
  visible: boolean;
  categoryId: string;
  categories: ExpenseCategory[];
  onDismiss: () => void;
  onSave: (e: ExpenseCategory[]) => Promise<void>;
  setSettings: (s: any) => void;
  onSnack: (m: string) => void;
}) {
  const { surface } = useAppTheme();
  const [subName, setSubName] = useState('');
  const cat = categories.find((c) => c.id === categoryId);

  const add = () => {
    if (!cat || !subName.trim()) return;
    const subs = [...cat.subs, subName.trim()];
    const next = categories.map((c) => (c.id === categoryId ? { ...c, subs } : c));
    onSave(next);
    setSettings({ expense_categories: next });
    setSubName('');
    onSnack('Subcategory added');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: surface }]}>
          <Text variant="titleMedium">Add Subcategory</Text>
          <TextInput label="Subcategory Name" value={subName} onChangeText={setSubName} mode="outlined" style={styles.input} />
          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={add}>Add</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Subscriptions ---
function daysUntil(dateStr: string): number {
  if (!dateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr + 'T00:00:00').getTime() - now.getTime()) / 86400000);
}

function SubscriptionsPanel({
  list,
  onSave,
  onSnack,
  setSettings,
}: {
  list: Subscription[];
  onSave: (s: Subscription[]) => Promise<void>;
  onSnack: (m: string) => void;
  setSettings: (s: any) => void;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  const [modal, setModal] = useState<{ open: boolean; item?: Subscription }>({ open: false });

  const alerts = list.filter((s) => s.active && s.next_due && daysUntil(s.next_due) <= (s.alert_days ?? 5));

  const add = () => setModal({ open: true });
  const edit = (item: Subscription) => setModal({ open: true, item });
  const remove = (id: string) => {
    Alert.alert('Delete', 'Delete this subscription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = list.filter((x) => x.id !== id);
          await onSave(next);
          setSettings({ subscriptions: next });
          onSnack('Deleted');
        },
      },
    ]);
  };
  const toggle = async (id: string) => {
    const next = list.map((x) => (x.id === id ? { ...x, active: !x.active } : x));
    await onSave(next);
    setSettings({ subscriptions: next });
    onSnack('Updated');
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Subscriptions Tracker</Text>
        <Button mode="contained" onPress={add} compact>+ Add</Button>
      </View>
      {alerts.map((s) => {
        const d = daysUntil(s.next_due!);
        return (
          <View key={s.id} style={[styles.alertBanner, d < 0 ? styles.alertOverdue : styles.alertDue]}>
            <Text variant="bodySmall">{d < 0 ? 'OVERDUE' : `Due in ${d}d`}: {s.name} — {s.amount?.toLocaleString()} UGX / {s.freq}</Text>
          </View>
        );
      })}
      {list.map((s) => (
        <View key={s.id} style={[styles.listItem, { borderBottomColor: borderSubtle }]}>
          <View style={styles.listItemInfo}>
            <Text variant="titleSmall">{s.name} {s.active ? <Chip compact style={styles.badgeGreen}>Active</Chip> : <Chip compact style={styles.badgeGray}>Off</Chip>}</Text>
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
              {s.amount?.toLocaleString()} UGX / {s.freq} | Next due: {s.next_due ? `${formatDate(s.next_due)} (in ${daysUntil(s.next_due)}d)` : 'Not set'}
            </Text>
          </View>
          <View style={styles.listItemActions}>
            <IconButton icon="pencil" size={20} onPress={() => edit(s)} />
            <Button compact onPress={() => toggle(s.id)}>{s.active ? 'Disable' : 'Enable'}</Button>
            <IconButton icon="delete" size={20} onPress={() => remove(s.id)} />
          </View>
        </View>
      ))}
      <SubscriptionModal
        visible={modal.open}
        item={modal.item}
        onDismiss={() => setModal({ open: false })}
        onSave={async (item) => {
          const next = modal.item
            ? list.map((x) => (x.id === modal.item!.id ? { ...item, id: x.id } : x))
            : [...list, { ...item, id: uid(), active: true }];
          await onSave(next);
          setSettings({ subscriptions: next });
          setModal({ open: false });
          onSnack('Saved');
        }}
      />
    </View>
  );
}

function SubscriptionModal({
  visible,
  item,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  item?: Subscription;
  onDismiss: () => void;
  onSave: (v: Omit<Subscription, 'id'> & { id?: string }) => Promise<void>;
}) {
  const { surface } = useAppTheme();
  const [name, setName] = useState(item?.name ?? '');
  const [amount, setAmount] = useState(String(item?.amount ?? ''));
  const [freq, setFreq] = useState(item?.freq ?? 'monthly');
  const [next_due, setNextDue] = useState(item?.next_due ?? '');
  const [alert_days, setAlertDays] = useState(String(item?.alert_days ?? 5));
  const [notes, setNotes] = useState(item?.notes ?? '');
  useEffect(() => {
    setName(item?.name ?? '');
    setAmount(String(item?.amount ?? ''));
    setFreq(item?.freq ?? 'monthly');
    setNextDue(item?.next_due ?? '');
    setAlertDays(String(item?.alert_days ?? 5));
    setNotes(item?.notes ?? '');
  }, [item, visible]);

  const save = () => {
    if (!name.trim()) return;
    const amt = parseInt(amount, 10);
    const alert = parseInt(alert_days, 10);
    onSave({
      name: name.trim(),
      amount: isNaN(amt) ? 0 : amt,
      freq,
      next_due: next_due || undefined,
      alert_days: isNaN(alert) ? 5 : alert,
      notes: notes.trim() || undefined,
      active: item?.active ?? true,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: surface }]}>
          <Text variant="titleMedium">{item ? 'Edit Subscription' : 'Add Subscription'}</Text>
          <TextInput label="Service Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
          <TextInput label="Amount (UGX)" value={amount} onChangeText={setAmount} keyboardType="number-pad" mode="outlined" style={styles.input} />
          <SegmentedButtons
            buttons={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]}
            value={freq}
            onValueChange={setFreq}
            style={styles.segmented}
          />
          <TextInput label="Next Due (YYYY-MM-DD)" value={next_due} onChangeText={setNextDue} mode="outlined" style={styles.input} />
          <TextInput label="Alert days before" value={alert_days} onChangeText={setAlertDays} keyboardType="number-pad" mode="outlined" style={styles.input} />
          <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} multiline />
          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={save}>Save</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Users ---
function UsersPanel({
  users,
  onRefresh,
  onSnack,
  setUsers,
}: {
  users: UserListItem[];
  onRefresh: () => void;
  onSnack: (m: string) => void;
  setUsers: (u: UserListItem[]) => void;
}) {
  const { textSecondary, borderSubtle } = useAppTheme();
  const [modal, setModal] = useState<{ open: boolean; user?: UserListItem }>({ open: false });

  const add = () => setModal({ open: true });
  const edit = (u: UserListItem) => setModal({ open: true, user: u });

  const toggle = async (id: number) => {
    try {
      const { data } = await api.patch(`/users/${id}/toggle`);
      setUsers(users.map((u) => (u.id === id ? { ...u, active: data.active } : u)));
      onSnack(data.active ? 'User activated' : 'User deactivated');
    } catch (e: unknown) {
      onSnack((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed');
    }
  };

  const remove = (u: UserListItem) => {
    Alert.alert('Delete User', `Delete ${u.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${u.id}`);
            setUsers(users.filter((x) => x.id !== u.id));
            onSnack('User deleted');
          } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not delete';
            onSnack(msg);
          }
        },
      },
    ]);
  };

  const permSummary = (p: string | string[]) => {
    if (p === 'all') return 'Full Admin';
    const arr = Array.isArray(p) ? p : [];
    return `${arr.length} tabs access`;
  };

  return (
    <View style={styles.panelInner}>
      <View style={styles.rowBetween}>
        <Text variant="titleMedium">Users & Access</Text>
        <Button mode="contained" onPress={add} compact>+ Add User</Button>
      </View>
      {users.map((u) => (
        <View key={u.id} style={[styles.listItem, { borderBottomColor: borderSubtle }]}>
          <View style={styles.listItemInfo}>
            <Text variant="titleSmall">
              {u.name} {u.role === 'admin' ? <Chip compact style={styles.badgeAmber}>Admin</Chip> : <Chip compact>{u.role}</Chip>}
              {!u.active && <Chip compact style={styles.badgeRed}>Inactive</Chip>}
            </Text>
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>ID: {u.id} | {permSummary(u.permissions)} | {u.phone || 'No phone'}</Text>
          </View>
          <View style={styles.listItemActions}>
            <IconButton icon="pencil" size={20} onPress={() => edit(u)} />
            <Button compact onPress={() => toggle(u.id)}>{u.active ? 'Deactivate' : 'Activate'}</Button>
            <IconButton icon="delete" size={20} onPress={() => remove(u)} />
          </View>
        </View>
      ))}
      <UserModal
        visible={modal.open}
        user={modal.user}
        onDismiss={() => setModal({ open: false })}
        onSaved={(updated) => {
          if (modal.user) {
            setUsers(users.map((x) => (x.id === updated.id ? updated : x)));
          } else {
            setUsers([...users, updated]);
          }
          setModal({ open: false });
          onSnack('User saved');
        }}
      />
    </View>
  );
}

function UserModal({
  visible,
  user,
  onDismiss,
  onSaved,
}: {
  visible: boolean;
  user?: UserListItem;
  onDismiss: () => void;
  onSaved: (u: UserListItem) => void;
}) {
  const { surface } = useAppTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [id_number, setIdNumber] = useState(user?.id_number ?? '');
  const [role, setRole] = useState(user?.role ?? 'attendant');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pin, setPin] = useState('');
  const [fullAdmin, setFullAdmin] = useState(user ? (user.permissions === 'all') : false);
  const [tabs, setTabs] = useState<string[]>(Array.isArray(user?.permissions) ? user.permissions : []);
  useEffect(() => {
    setName(user?.name ?? '');
    setIdNumber(user?.id_number ?? '');
    setRole(user?.role ?? 'attendant');
    setPhone(user?.phone ?? '');
    setPin('');
    setFullAdmin(user ? (user.permissions === 'all') : false);
    setTabs(Array.isArray(user?.permissions) ? user.permissions : []);
  }, [user, visible]);

  const TAB_OPTIONS = ['dashboard', 'daily-entry', 'vouchers', 'reconcile', 'sales-log', 'expenses', 'assets', 'guide'];

  const toggleTab = (t: string) => {
    if (tabs.includes(t)) setTabs(tabs.filter((x) => x !== t));
    else setTabs([...tabs, t]);
  };

  const save = async () => {
    if (!name.trim()) return;
    if (!user && (pin.length !== 4)) return;
    const permissions = fullAdmin ? 'all' : tabs;
    try {
      if (user) {
        const body: Record<string, unknown> = { name: name.trim(), id_number: id_number || undefined, role, phone, permissions };
        if (pin.length === 4) body.pin = pin;
        const { data } = await api.put(`/users/${user.id}`, body);
        onSaved(data.user);
      } else {
        const { data } = await api.post('/users', { name: name.trim(), id_number: id_number || undefined, role, phone, pin, permissions });
        onSaved(data.user);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save user';
      Alert.alert('Error', msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalScroll}>
          <View style={[styles.modalBox, { backgroundColor: surface }]}>
            <Text variant="titleMedium">{user ? 'Edit User' : 'Add User'}</Text>
            <TextInput label="Full Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="ID Number" value={id_number} onChangeText={setIdNumber} mode="outlined" style={styles.input} placeholder="e.g. ATT-002" />
            <TextInput label="Role / Title" value={role} onChangeText={setRole} mode="outlined" style={styles.input} placeholder="Attendant" />
            <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
            <TextInput label="PIN (4 digits)" value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4} mode="outlined" style={styles.input} placeholder={user ? 'Leave blank to keep' : 'Required'} />
            <Divider style={styles.divider} />
            <Text variant="titleSmall">Access Permissions</Text>
            <Chip selected={fullAdmin} onPress={() => setFullAdmin(!fullAdmin)} style={styles.chipMargin}>Full Admin (all tabs + Settings)</Chip>
            {!fullAdmin && (
              <View style={styles.chipRow}>
                {TAB_OPTIONS.map((t) => (
                  <Chip key={t} selected={tabs.includes(t)} onPress={() => toggleTab(t)} style={styles.chipMargin}>{t}</Chip>
                ))}
              </View>
            )}
            <View style={styles.modalActions}>
              <Button onPress={onDismiss}>Cancel</Button>
              <Button mode="contained" onPress={save}>Save User</Button>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- Security ---
function SecurityPanel({ onSnack }: { onSnack: (m: string) => void }) {
  const requirePinOnLaunch = useAppPreferencesStore((s) => s.requirePinOnLaunch);
  const autoLockMinutes = useAppPreferencesStore((s) => s.autoLockMinutes);
  const setRequirePinOnLaunch = useAppPreferencesStore((s) => s.setRequirePinOnLaunch);
  const setAutoLockMinutes = useAppPreferencesStore((s) => s.setAutoLockMinutes);
  const lockOptions: { value: AutoLockMinutes; label: string }[] = [
    { value: 0, label: 'Never' },
    { value: 1, label: '1 min' },
    { value: 5, label: '5 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
  ];
  return (
    <View style={styles.panelInner}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Security</Text>
      <List.Item
        title="Require PIN on app launch"
        description="Ask for PIN when opening the app"
        right={() => <Switch value={requirePinOnLaunch} onValueChange={(v) => { setRequirePinOnLaunch(v); onSnack(v ? 'PIN required on launch' : 'PIN optional'); }} />}
        style={styles.listItemPref}
      />
      <Text variant="bodySmall" style={styles.muted}>Auto-lock after inactivity</Text>
      <SegmentedButtons
        buttons={lockOptions.map((o) => ({ value: String(o.value), label: o.label }))}
        value={String(autoLockMinutes)}
        onValueChange={(v) => { setAutoLockMinutes(Number(v) as AutoLockMinutes); onSnack('Auto-lock updated'); }}
        style={styles.segmented}
      />
    </View>
  );
}

// --- Biometrics ---
function BiometricsPanel({ onSnack }: { onSnack: (m: string) => void }) {
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const biometricsEnabled = useAppPreferencesStore((s) => s.biometricsEnabled);
  const setBiometricsEnabled = useAppPreferencesStore((s) => s.setBiometricsEnabled);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { hasHardwareAsync, supportedAuthenticationTypesAsync } = await import('expo-local-authentication');
        const hasHardware = await hasHardwareAsync();
        if (cancelled) return;
        setSupported(hasHardware);
        if (!hasHardware) return;
        const types = await supportedAuthenticationTypesAsync();
        if (cancelled) return;
        const names: Record<number, string> = { 1: 'Fingerprint', 2: 'Face ID' };
        setBiometricType(types.length > 0 ? (names[types[0]] ?? 'Biometric') : null);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <View style={styles.panelInner}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Biometrics</Text>
      {supported === false && (
        <Text variant="bodySmall" style={styles.muted}>No biometric hardware available on this device.</Text>
      )}
      {supported === true && (
        <List.Item
          title={biometricType ? `Use ${biometricType} to unlock` : 'Use biometrics to unlock'}
          description="Unlock the app with fingerprint or face"
          right={() => <Switch value={biometricsEnabled} onValueChange={(v) => { setBiometricsEnabled(v); onSnack(v ? 'Biometrics enabled' : 'Biometrics disabled'); }} />}
          style={styles.listItemPref}
        />
      )}
    </View>
  );
}

// --- Notifications ---
function NotificationsPanel({ onSnack }: { onSnack: (m: string) => void }) {
  const notificationsEnabled = useAppPreferencesStore((s) => s.notificationsEnabled);
  const notificationSubscriptionAlerts = useAppPreferencesStore((s) => s.notificationSubscriptionAlerts);
  const notificationDailyReminder = useAppPreferencesStore((s) => s.notificationDailyReminder);
  const notificationRevenueAlert = useAppPreferencesStore((s) => s.notificationRevenueAlert);
  const setNotificationsEnabled = useAppPreferencesStore((s) => s.setNotificationsEnabled);
  const setNotificationSubscriptionAlerts = useAppPreferencesStore((s) => s.setNotificationSubscriptionAlerts);
  const setNotificationDailyReminder = useAppPreferencesStore((s) => s.setNotificationDailyReminder);
  const setNotificationRevenueAlert = useAppPreferencesStore((s) => s.setNotificationRevenueAlert);
  return (
    <View style={styles.panelInner}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Notifications</Text>
      <List.Item
        title="Enable notifications"
        description="Allow push and in-app alerts"
        right={() => <Switch value={notificationsEnabled} onValueChange={(v) => { setNotificationsEnabled(v); onSnack(v ? 'Notifications on' : 'Notifications off'); }} />}
        style={styles.listItemPref}
      />
      <List.Item
        title="Subscription due alerts"
        description="Remind when subscriptions are due"
        right={() => <Switch value={notificationSubscriptionAlerts} onValueChange={(v) => { setNotificationSubscriptionAlerts(v); onSnack('Saved'); }} />}
        style={styles.listItemPref}
      />
      <List.Item
        title="Daily reminder"
        description="Daily summary or reminder"
        right={() => <Switch value={notificationDailyReminder} onValueChange={(v) => { setNotificationDailyReminder(v); onSnack('Saved'); }} />}
        style={styles.listItemPref}
      />
      <List.Item
        title="Revenue below threshold"
        description="Alert when daily revenue is low"
        right={() => <Switch value={notificationRevenueAlert} onValueChange={(v) => { setNotificationRevenueAlert(v); onSnack('Saved'); }} />}
        style={styles.listItemPref}
      />
    </View>
  );
}

// --- Warnings ---
function WarningsPanel({ onSnack }: { onSnack: (m: string) => void }) {
  const [thresholdInput, setThresholdInput] = useState('');
  const warningLowBalanceThreshold = useAppPreferencesStore((s) => s.warningLowBalanceThreshold);
  const warningDowntimeDays = useAppPreferencesStore((s) => s.warningDowntimeDays);
  const warningShowOverdueSubscriptions = useAppPreferencesStore((s) => s.warningShowOverdueSubscriptions);
  const warningRevenueBelowThreshold = useAppPreferencesStore((s) => s.warningRevenueBelowThreshold);
  const setWarningLowBalanceThreshold = useAppPreferencesStore((s) => s.setWarningLowBalanceThreshold);
  const setWarningDowntimeDays = useAppPreferencesStore((s) => s.setWarningDowntimeDays);
  const setWarningShowOverdueSubscriptions = useAppPreferencesStore((s) => s.setWarningShowOverdueSubscriptions);
  const setWarningRevenueBelowThreshold = useAppPreferencesStore((s) => s.setWarningRevenueBelowThreshold);
  useEffect(() => {
    setThresholdInput(String(warningLowBalanceThreshold));
  }, [warningLowBalanceThreshold]);
  const saveThreshold = () => {
    const n = parseInt(thresholdInput, 10);
    if (!isNaN(n) && n >= 0) {
      setWarningLowBalanceThreshold(n);
      onSnack('Threshold saved');
    }
  };
  return (
    <View style={styles.panelInner}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Warnings & Alerts</Text>
      <List.Item
        title="Show overdue subscriptions"
        description="Warn when subscriptions are past due"
        right={() => <Switch value={warningShowOverdueSubscriptions} onValueChange={(v) => { setWarningShowOverdueSubscriptions(v); onSnack('Saved'); }} />}
        style={styles.listItemPref}
      />
      <List.Item
        title="Revenue below threshold"
        description="Warn on dashboard when revenue is low"
        right={() => <Switch value={warningRevenueBelowThreshold} onValueChange={(v) => { setWarningRevenueBelowThreshold(v); onSnack('Saved'); }} />}
        style={styles.listItemPref}
      />
      <Text variant="bodySmall" style={styles.muted}>Low revenue / balance threshold (UGX)</Text>
      <View style={styles.rowBetween}>
        <TextInput
          value={thresholdInput}
          onChangeText={setThresholdInput}
          keyboardType="number-pad"
          mode="outlined"
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="e.g. 50000"
        />
        <Button mode="contained" compact onPress={saveThreshold}>Save</Button>
      </View>
      <Text variant="bodySmall" style={styles.muted}>Downtime warning (days)</Text>
      <SegmentedButtons
        buttons={[
          { value: '0', label: 'Off' },
          { value: '1', label: '1 day' },
          { value: '3', label: '3 days' },
          { value: '7', label: '7 days' },
        ]}
        value={String(warningDowntimeDays)}
        onValueChange={(v) => { setWarningDowntimeDays(Number(v)); onSnack('Saved'); }}
        style={styles.segmented}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  settingsScrollContent: { flexGrow: 1 },
  unauthorized: { textAlign: 'center', marginTop: 24 },
  card: { flex: 1, marginBottom: 16 },
  cardContent: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerColumn: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  settingsTitle: {},
  tabRow: { maxHeight: 56, marginBottom: 8 },
  tabRowContent: { gap: 8, paddingVertical: 4 },
  tabChip: { marginRight: 4 },
  divider: { marginVertical: 8 },
  panel: { flex: 1 },
  panelInner: { paddingVertical: 8 },
  sectionTitle: { marginBottom: 12 },
  listItemPref: { backgroundColor: 'transparent' },
  generalSection: { marginTop: 12, marginBottom: 8 },
  settingRow: { marginBottom: 12 },
  settingLabel: { marginBottom: 6 },
  listItemSetting: { backgroundColor: 'transparent' },
  errorText: { color: '#f44336', marginBottom: 8 },
  logout: { marginTop: 8 },
  input: { marginBottom: 12 },
  primaryBtn: { marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  listItemInfo: { flex: 1 },
  listItemActions: { flexDirection: 'row', alignItems: 'center' },
  badgeGreen: { backgroundColor: '#22c55e' },
  badgeGray: { backgroundColor: '#64748b' },
  badgeAmber: { backgroundColor: '#f59e0b' },
  badgeRed: { backgroundColor: '#ef4444' },
  muted: { color: '#94a3b8' },
  totalBar: { backgroundColor: '#1e3a5f', padding: 12, marginTop: 12, borderRadius: 8 },
  logList: { maxHeight: 320 },
  logRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#334155' },
  logTime: { width: 120, fontSize: 11, color: '#94a3b8' },
  logUser: { width: 70, fontWeight: 'bold', color: '#6366f1' },
  logAction: { width: 110, color: '#2dd4bf' },
  logDetail: { flex: 1, fontSize: 11, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalScroll: { maxHeight: '80%' },
  modalBox: { borderRadius: 12, padding: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  segmented: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  chipMargin: { marginRight: 4, marginBottom: 4 },
  subChip: { marginRight: 4, marginBottom: 4 },
  alertBanner: { padding: 10, borderRadius: 8, marginBottom: 8 },
  alertDue: { backgroundColor: '#f59e0b33' },
  alertOverdue: { backgroundColor: '#ef444433' },
});
