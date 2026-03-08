import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/features/auth/store';
import { setCredentials } from '../src/features/auth/authSlice';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { getApiBaseUrl } from '../src/config/apiUrl';

const WEAK_PINS = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];

function isWeakPin(pin: string): boolean {
  if (pin.length !== 4) return true;
  if (WEAK_PINS.includes(pin)) return true;
  if (/^(\d)\1{3}$/.test(pin)) return true; // all same digit
  return false;
}

type SignupRole = 'user' | 'admin' | null;

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  const { register, error, clearError } = useAuthStore();
  const [signupRole, setSignupRole] = useState<SignupRole>(null);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Wake Render server (free tier sleeps after ~15 min) so signup is faster
  useEffect(() => {
    getApiBaseUrl().then((base) => fetch(`${base}/api/health`).catch(() => {}));
  }, []);

  const handleSignup = async () => {
    clearError();
    setLocalError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError('Please enter your name');
      return;
    }
    if (pin.length !== 4) {
      setLocalError('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setLocalError('PINs do not match');
      return;
    }
    if (isWeakPin(pin)) {
      setLocalError('Choose a stronger PIN (avoid 1234, 0000, or repeated digits)');
      return;
    }

    const role = signupRole ?? 'user';
    const ok = await register(trimmedName, pin, role);
    if (ok) {
      const { token, user } = useAuthStore.getState();
      if (token && user) {
        dispatch(setCredentials({ token, user }));
        Alert.alert(
          'Account created',
          `Your User ID is ${user.id}. Use it with your PIN to sign in.`,
          [{ text: 'OK', onPress: () => router.replace('/(main)/dashboard') }]
        );
      } else {
        router.replace('/(main)/dashboard');
      }
    }
  };

  const displayError = localError || error;

  // Step 1: Choose User or Admin
  if (signupRole === null) {
    return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text variant="headlineMedium" style={[styles.title, { color: textPrimary }]}>
            Create account
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
            Sign up as a User (attendant) or as the first Admin
          </Text>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: surface }]}
            onPress={() => { clearError(); setSignupRole('user'); }}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconWrap}>
              <MaterialCommunityIcons name="account" size={32} color="#0B6E6E" />
            </View>
            <Text variant="titleLarge" style={[styles.roleTitle, { color: textPrimary }]}>User</Text>
            <Text variant="bodySmall" style={[styles.roleDesc, { color: textSecondary }]}>
              Attendant — daily entry, sales, limited access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: surface }]}
            onPress={() => { clearError(); setSignupRole('admin'); }}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIconWrap, styles.roleIconAdmin]}>
              <MaterialCommunityIcons name="shield-account" size={32} color="#C9A84C" />
            </View>
            <Text variant="titleLarge" style={[styles.roleTitle, { color: textPrimary }]}>Admin</Text>
            <Text variant="bodySmall" style={[styles.roleDesc, { color: textSecondary }]}>
              Full access — settings, users, reports.
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="text"
            onPress={() => { clearError(); router.replace('/login'); }}
            style={styles.backButton}
            labelStyle={[styles.backLabel, { color: textSecondary }]}
          >
            Back to sign in
          </Button>
        </ScrollView>
      </View>
    );
  }

  // Step 2: Form
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineMedium" style={[styles.title, { color: textPrimary }]}>
          Sign up as {signupRole === 'admin' ? 'Admin' : 'User'}
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
          {signupRole === 'admin'
            ? 'Create the first admin account for SureLink WiFi Manager'
            : 'Create your attendant account. You’ll get a User ID to sign in.'}
        </Text>

        <TextInput
          label="Your name"
          value={name}
          onChangeText={(t) => { setName(t); setLocalError(null); }}
          mode="outlined"
          autoCapitalize="words"
          style={styles.input}
          placeholder={signupRole === 'admin' ? 'e.g. Admin' : 'e.g. John'}
        />
        <TextInput
          label="4-digit PIN"
          value={pin}
          onChangeText={(t) => { setPin(t.replace(/\D/g, '').slice(0, 4)); setLocalError(null); }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          mode="outlined"
          style={styles.input}
          placeholder="••••"
        />
        <TextInput
          label="Confirm PIN"
          value={confirmPin}
          onChangeText={(t) => { setConfirmPin(t.replace(/\D/g, '').slice(0, 4)); setLocalError(null); }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          mode="outlined"
          style={styles.input}
          placeholder="••••"
        />

        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

        <Button mode="contained" onPress={handleSignup} style={styles.button}>
          Create {signupRole === 'admin' ? 'admin' : 'user'} account
        </Button>

        <Button
          mode="text"
          onPress={() => { setSignupRole(null); setLocalError(null); clearError(); }}
          style={styles.backButton}
          labelStyle={[styles.backLabel, { color: textSecondary }]}
        >
          Change role
        </Button>
        <Button
          mode="text"
          onPress={() => { clearError(); setSignupRole(null); router.replace('/login'); }}
          style={styles.backButton}
          labelStyle={[styles.backLabel, { color: textSecondary }]}
        >
          Back to sign in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  roleCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(11, 110, 110, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleIconAdmin: {
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
  },
  roleTitle: {
    marginBottom: 4,
  },
  roleDesc: {
    marginBottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    color: '#f44336',
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
  backLabel: {},
});
