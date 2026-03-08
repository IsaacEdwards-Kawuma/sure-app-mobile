import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button, TextInput, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/features/auth/store';
import { useSettingsStore } from '../../src/features/settings/store';
import { getLoginLog, type LoginLogEntry } from '../../src/localDb/operations';
import {
  setApiBaseUrl,
  getStoredApiUrl,
  getDefaultApiBaseUrl,
  clearApiBaseUrl,
} from '../../src/config/apiUrl';
import { useAppTheme } from '../../src/hooks/useAppTheme';

const ADMIN_LINKS = [
  { href: '/(main)/settings', icon: 'cog', label: 'Settings', desc: 'Business, users, revenue, packages' },
  { href: '/(main)/settings', icon: 'account-group', label: 'Users', desc: 'Manage users & access' },
  { href: '/(main)/dashboard', icon: 'view-dashboard', label: 'Dashboard', desc: 'KPIs & charts' },
  { href: '/(main)/sales-log', icon: 'format-list-bulleted', label: 'Sales Log', desc: 'View all sales' },
  { href: '/(main)/analytics', icon: 'chart-line', label: 'Analytics', desc: 'Reports & trends' },
];

function formatLoginTime(created_at: string): string {
  try {
    const d = new Date(created_at);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return created_at;
  }
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.permissions === 'all';
  const { background, surface, textSecondary } = useAppTheme();
  const { users, fetchSettings, fetchUsers, fetchAdminLog, loading } = useSettingsStore();
  const [loginLog, setLoginLog] = useState<LoginLogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState('');
  const [apiUrlLoaded, setApiUrlLoaded] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchSettings();
    fetchUsers();
    fetchAdminLog();
  }, [isAdmin, fetchSettings, fetchUsers, fetchAdminLog]);

  const loadLoginLog = async () => {
    try {
      const log = await getLoginLog(80);
      setLoginLog(log);
    } catch {
      setLoginLog([]);
    }
  };

  useEffect(() => {
    if (isAdmin) loadLoginLog();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      getStoredApiUrl().then((stored) => {
        setApiUrlInput(stored && stored.trim() ? stored : getDefaultApiBaseUrl());
        setApiUrlLoaded(true);
      });
    }
  }, [isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSettings(),
      fetchUsers(),
      fetchAdminLog(),
      loadLoginLog(),
      getStoredApiUrl().then((stored) => setApiUrlInput(stored && stored.trim() ? stored : getDefaultApiBaseUrl())),
    ]);
    setRefreshing(false);
  };

  const handleSaveApiUrl = async () => {
    const url = apiUrlInput.trim().replace(/\/+$/, '');
    if (!url) return;
    await setApiBaseUrl(url);
    setSnack('Connection string saved. Use Remote server and re-open app.');
  };
  const handleClearApiUrl = async () => {
    await clearApiBaseUrl();
    setApiUrlInput('');
    setSnack('Connection string cleared. App will use default from .env.');
  };
  const dismissSnack = () => setSnack('');

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.unauthorized, { color: textSecondary }]}>
              Admin access required to view this page.
            </Text>
            <Button mode="outlined" onPress={() => router.replace('/(main)/dashboard')} style={styles.backBtn}>
              Go back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const activeUsers = users.filter((u) => u.active).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} tintColor="#C9A84C" />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Admin Dashboard
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
          Monitor app usage, sensitive settings, and admin features
        </Text>
      </View>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="#C9A84C" />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Sensitive settings
            </Text>
          </View>
          <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
            Server URL: API address (default: https://sure-app-mobile.onrender.com). Backend uses your Neon database.
          </Text>
          {apiUrlLoaded && (
            <>
              <TextInput
                label="Server URL (connection string)"
                value={apiUrlInput}
                onChangeText={setApiUrlInput}
                placeholder={getDefaultApiBaseUrl()}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.apiUrlInput}
              />
              <View style={styles.apiUrlActions}>
                <Button mode="outlined" compact onPress={handleClearApiUrl}>
                  Clear
                </Button>
                <Button mode="contained" compact onPress={handleSaveApiUrl}>
                  Save URL
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="login" size={22} color="#C9A84C" />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Recent logins
            </Text>
          </View>
          <View style={styles.logList}>
            {loginLog.length === 0 && (
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                No login records yet.
              </Text>
            )}
            {loginLog.slice(0, 20).map((entry) => (
              <View key={entry.id} style={styles.logRow}>
                <View style={styles.logRowLeft}>
                  <Text variant="bodyMedium" style={styles.logUserName} numberOfLines={1}>
                    {entry.user_name}
                  </Text>
                  <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                    ID {entry.user_id} · {entry.source}
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.logTime, { color: textSecondary }]}>
                  {formatLoginTime(entry.created_at)}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-group" size={22} color="#C9A84C" />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Users
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {users.length}
              </Text>
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                Total
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {activeUsers}
              </Text>
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                Active
              </Text>
            </View>
          </View>
          <Button
            mode="outlined"
            compact
            onPress={() => router.push('/(main)/settings')}
            icon="cog"
            style={styles.linkBtn}
          >
            Manage in Settings
          </Button>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Admin shortcuts
      </Text>
      {ADMIN_LINKS.map((item) => {
        const linkCardStyle = { backgroundColor: surface };
        const mutedStyle = { color: textSecondary };
        return (
          <TouchableOpacity
            key={item.label}
            style={[styles.linkCard, linkCardStyle]}
            onPress={() => router.push(item.href as any)}
            activeOpacity={0.8}
          >
            <View style={styles.linkIconWrap}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color="#C9A84C" />
            </View>
            <View style={styles.linkText}>
              <Text variant="titleSmall" style={styles.linkLabel}>
                {item.label}
              </Text>
              <Text variant="bodySmall" style={[styles.muted, mutedStyle]}>
                {item.desc}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={textSecondary} />
          </TouchableOpacity>
        );
      })}

      <Snackbar visible={!!snack} onDismiss={dismissSnack} duration={4000}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  title: { color: '#ffffff' },
  subtitle: { marginTop: 4 },
  card: { marginBottom: 16, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { color: '#ffffff' },
  logList: { maxHeight: 320 },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  logRowLeft: { flex: 1, minWidth: 0 },
  logUserName: { color: '#e2e8f0' },
  logTime: { marginLeft: 8 },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  statBox: { alignItems: 'center' },
  statValue: { color: '#C9A84C' },
  linkBtn: { marginTop: 8 },
  sectionTitle: { color: '#e2e8f0', marginBottom: 12, marginTop: 8 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  linkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkText: { flex: 1 },
  linkLabel: { color: '#e2e8f0' },
  muted: {},
  unauthorized: { marginBottom: 16 },
  backBtn: { marginTop: 8 },
  apiUrlInput: { marginTop: 12, marginBottom: 8 },
  apiUrlActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
});
