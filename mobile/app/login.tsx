import { useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuthStore } from '../src/features/auth/store';
import { setCredentials } from '../src/features/auth/authSlice';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { getApiBaseUrl } from '../src/config/apiUrl';

type LoginBy = 'userId' | 'userName';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { login, fetchUsers, error, users } = useAuthStore();
  const [loginBy, setLoginBy] = useState<LoginBy>('userId');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    fetchUsers();
    // Wake Render server (free tier sleeps) so login is faster
    getApiBaseUrl().then((base) => fetch(`${base}/api/health`).catch(() => {}));
  }, []);

  const handleLogin = async () => {
    let id: number;
    if (loginBy === 'userName') {
      const trimmed = userName.trim();
      if (!trimmed) return;
      const match = users.find((u) => u.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (!match) {
        useAuthStore.setState({ error: 'No user found with that name' });
        return;
      }
      id = match.id;
    } else {
      const n = Number(userId);
      if (!userId || isNaN(n)) return;
      id = n;
    }
    const ok = await login(id, pin);
    if (ok) {
      const { token, user } = useAuthStore.getState();
      if (token && user) {
        dispatch(setCredentials({ token, user }));
        try {
          const { recordLoginStamp } = await import('../src/localDb/operations');
          await recordLoginStamp(user.id, user.name, 'remote');
        } catch (_) {}
      }
      router.replace('/(main)/dashboard');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: background }]} keyboardShouldPersistTaps="handled">
      <Text variant="headlineMedium" style={[styles.title, { color: textPrimary }]}>
        SureLink WiFi Manager
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
        Sign in with your PIN
      </Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: surface }, loginBy === 'userId' && styles.toggleBtnActive]}
          onPress={() => setLoginBy('userId')}
        >
          <Text style={[styles.toggleText, { color: textSecondary }, loginBy === 'userId' && styles.toggleTextActive]}>
            User ID
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: surface }, loginBy === 'userName' && styles.toggleBtnActive]}
          onPress={() => setLoginBy('userName')}
        >
          <Text style={[styles.toggleText, { color: textSecondary }, loginBy === 'userName' && styles.toggleTextActive]}>
            User name
          </Text>
        </TouchableOpacity>
      </View>

      {loginBy === 'userId' ? (
        <TextInput
          label="User ID"
          value={userId}
          onChangeText={setUserId}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.input}
          placeholder="e.g. 1"
        />
      ) : (
        <TextInput
          label="User name"
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
          mode="outlined"
          style={styles.input}
          placeholder="e.g. Admin"
        />
      )}

      <TextInput
        label="4-digit PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        mode="outlined"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Sign In
      </Button>
      <TouchableOpacity onPress={() => router.push('/signup')} style={styles.signupLink}>
        <Text style={[styles.signupText, { color: textSecondary }]}>Don’t have an account? Create one</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 32,
  },
  title: { marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 16, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: { fontSize: 14 },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  input: { marginBottom: 12 },
  error: { color: '#f44336', marginBottom: 8 },
  button: { marginTop: 8 },
  signupLink: { marginTop: 20, alignSelf: 'center' },
  signupText: { fontSize: 14 },
});
