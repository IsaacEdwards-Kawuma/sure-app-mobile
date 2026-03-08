import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useMeQuery, useUpdateProfileMutation } from '../../src/api/authApi';
import { useAuthStore } from '../../src/features/auth/store';
import { setCredentials } from '../../src/features/auth/authSlice';
import { logout as reduxLogout } from '../../src/features/auth/authSlice';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function UserScreen() {
  const router = useRouter();
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary, borderSubtle } = useAppTheme();
  const dispatch = useDispatch();
  const { data, refetch, isFetching } = useMeQuery();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.token);
  const logoutZustand = useAuthStore((s) => s.logout);
  const user = data?.user;
  const isAdmin = user?.permissions === 'all';

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [changePinModalVisible, setChangePinModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const syncUserToStores = (updatedUser: { id: number; name: string; role: string; permissions: string }) => {
    setUser(updatedUser);
    if (token) dispatch(setCredentials({ token, user: updatedUser }));
  };

  const handleSaveProfile = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    try {
      const result = await updateProfile({ name: trimmedName, phone: phone.trim() || undefined }).unwrap();
      syncUserToStores(result.user);
      setEditModalVisible(false);
      Alert.alert('Saved', 'Profile updated.');
    } catch (e: unknown) {
      setError((e as { data?: { error?: string } })?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePin = async () => {
    setError(null);
    if (currentPin.length !== 4 || newPin.length !== 4) {
      setError('PINs must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PIN and confirm do not match');
      return;
    }
    const weak = ['1234', '0000', '1111'].includes(newPin);
    if (weak) {
      setError('Choose a stronger PIN');
      return;
    }
    try {
      await updateProfile({ current_pin: currentPin, new_pin: newPin }).unwrap();
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setChangePinModalVisible(false);
      Alert.alert('PIN changed', 'Your PIN has been updated.');
    } catch (e: unknown) {
      setError((e as { data?: { error?: string } })?.data?.error || 'Failed to change PIN');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            dispatch(reduxLogout());
            await logoutZustand();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32, flexGrow: 1 }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text variant="titleMedium" style={[styles.title, { color: textPrimary }]}>User</Text>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          {user ? (
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text variant="titleLarge" style={[styles.name, { color: textPrimary }]}>{user.name}</Text>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>User ID: {user.id}</Text>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>Role: {user.role}</Text>
                {user.permissions ? (
                  <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>Permissions: {user.permissions}</Text>
                ) : null}
                {user.phone ? (
                  <Text variant="bodySmall" style={[styles.phone, { color: textSecondary }]}>Phone: {user.phone}</Text>
                ) : null}
                {user.created_at ? (
                  <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>?</Text>
              </View>
              <View style={styles.userInfo}>
                <Text variant="bodyLarge" style={[styles.name, { color: textPrimary }]}>Loading profile…</Text>
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>Pull to refresh if this doesn’t load.</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 8, color: textSecondary }]}>Features</Text>
      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content style={styles.featureList}>
          <TouchableOpacity style={[styles.featureRow, { borderBottomColor: borderSubtle }]} onPress={() => setEditModalVisible(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="pencil" size={22} color={colors.accent} style={styles.featureIcon} />
            <Text variant="bodyLarge" style={[styles.featureLabel, { color: textPrimary }]}>Edit profile</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.featureRow, { borderBottomColor: borderSubtle }]} onPress={() => { setError(null); setChangePinModalVisible(true); }} activeOpacity={0.7}>
            <MaterialCommunityIcons name="lock-reset" size={22} color={colors.accent} style={styles.featureIcon} />
            <Text variant="bodyLarge" style={[styles.featureLabel, { color: textPrimary }]}>Change PIN</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.featureRow, { borderBottomColor: borderSubtle }]} onPress={() => router.push('/(main)/guide')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.accent} style={styles.featureIcon} />
            <Text variant="bodyLarge" style={[styles.featureLabel, { color: textPrimary }]}>Guide</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={textSecondary} />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={[styles.featureRow, { borderBottomColor: borderSubtle }]} onPress={() => router.push('/(main)/settings')} activeOpacity={0.7}>
              <MaterialCommunityIcons name="cog" size={22} color={colors.accent} style={styles.featureIcon} />
              <Text variant="bodyLarge" style={[styles.featureLabel, { color: textPrimary }]}>Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={textSecondary} />
            </TouchableOpacity>
          )}
          <View style={[styles.featureRow, { borderBottomColor: borderSubtle }]}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.accent} style={styles.featureIcon} />
            <Text variant="bodyLarge" style={[styles.featureLabel, { color: textPrimary }]}>About</Text>
            <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>v{APP_VERSION}</Text>
          </View>
          <TouchableOpacity style={[styles.featureRow, styles.logoutRow]} onPress={handleLogout} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.danger} style={styles.featureIcon} />
            <Text variant="bodyLarge" style={styles.logoutLabel}>Log out</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={textSecondary} />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: textPrimary }]}>Edit profile</Text>
            <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
            <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" keyboardType="phone-pad" style={styles.input} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button onPress={() => setEditModalVisible(false)} mode="outlined" style={styles.modalBtn}>Cancel</Button>
              <Button onPress={handleSaveProfile} loading={updating} disabled={updating} mode="contained" style={styles.modalBtn}>Save</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={changePinModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: textPrimary }]}>Change PIN</Text>
            <TextInput
              label="Current PIN"
              value={currentPin}
              onChangeText={(t) => setCurrentPin(t.replace(/\D/g, '').slice(0, 4))}
              mode="outlined"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />
            <TextInput
              label="New PIN (4 digits)"
              value={newPin}
              onChangeText={(t) => setNewPin(t.replace(/\D/g, '').slice(0, 4))}
              mode="outlined"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />
            <TextInput
              label="Confirm new PIN"
              value={confirmPin}
              onChangeText={(t) => setConfirmPin(t.replace(/\D/g, '').slice(0, 4))}
              mode="outlined"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button onPress={() => { setChangePinModalVisible(false); setError(null); }} mode="outlined" style={styles.modalBtn}>Cancel</Button>
              <Button onPress={handleChangePin} loading={updating} disabled={updating} mode="contained" style={styles.modalBtn}>Change PIN</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { marginBottom: 16 },
  card: { marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  userInfo: { flex: 1 },
  name: { marginBottom: 4 },
  muted: { marginTop: 2 },
  phone: { marginTop: 4 },
  sectionTitle: { marginBottom: 12 },
  featureList: { paddingVertical: 4 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  featureIcon: { marginRight: 12 },
  featureLabel: { flex: 1 },
  logoutRow: { borderBottomWidth: 0 },
  logoutLabel: { color: colors.danger, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 12, padding: 20 },
  modalTitle: { marginBottom: 16 },
  input: { marginBottom: 12 },
  errorText: { color: colors.danger, marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalBtn: { minWidth: 100 },
});
