import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useCreateSaleMutation } from '../../src/api/salesApi';
import { useAuthUsersQuery } from '../../src/api/authApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { format } from 'date-fns';

export default function DailyEntryScreen() {
  const { spacing } = useResponsive();
  const { background, textSecondary } = useAppTheme();
  const [createSale, { isLoading }] = useCreateSaleMutation();
  const { data: usersData } = useAuthUsersQuery();
  const users = usersData?.users ?? [];

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendantId, setAttendantId] = useState<string>('');
  const [totalRevenue, setTotalRevenue] = useState('');
  const [notes, setNotes] = useState('');
  const [downtime, setDowntime] = useState('0');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const revenue = parseFloat(totalRevenue);
    if (isNaN(revenue) || revenue < 0) {
      setError('Enter a valid revenue amount');
      return;
    }
    try {
      await createSale({
        date,
        attendant_id: attendantId ? parseInt(attendantId, 10) : null,
        total_revenue: revenue,
        notes: notes.trim() || undefined,
        downtime: parseInt(downtime, 10) || 0,
      }).unwrap();
      setTotalRevenue('');
      setNotes('');
      setDowntime('0');
      Alert.alert('Saved', 'Daily entry saved successfully.');
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; status?: number; error?: string; message?: string; code?: string };
      let message =
        err?.data?.error ||
        err?.error ||
        (typeof err?.status === 'number' ? `Request failed (${err.status})` : null) ||
        err?.message ||
        'Failed to save entry.';
      if (
        !err?.data?.error &&
        (err?.message === 'Network request failed' || err?.code === 'ECONNREFUSED' || err?.code === 'ERR_NETWORK')
      ) {
        message =
          "Can't reach server. Start the backend (cd backend && npm start). On a physical device or Android emulator, set EXPO_PUBLIC_API_URL in mobile/.env to your PC's IP (e.g. http://192.168.1.10:3000), then restart Expo.";
      }
      setError(message);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]} keyboardShouldPersistTaps="handled">
        <Text variant="titleMedium" style={[styles.label, { color: textSecondary }]}>Date</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          mode="outlined"
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
        <Text variant="titleMedium" style={[styles.label, { color: textSecondary }]}>Attendant</Text>
        <TextInput
          value={attendantId}
          onChangeText={setAttendantId}
          mode="outlined"
          style={styles.input}
          placeholder="User ID (optional)"
          keyboardType="number-pad"
        />
        {users.length > 0 && (
          <Text variant="bodySmall" style={[styles.hint, { color: textSecondary }]}>
            Users: {users.map((u) => `${u.id}: ${u.name}`).join(', ')}
          </Text>
        )}
        <Text variant="titleMedium" style={[styles.label, { color: textSecondary }]}>Total Revenue (UGX)</Text>
        <TextInput
          value={totalRevenue}
          onChangeText={(t) => setTotalRevenue(t.replace(/[^0-9.]/g, ''))}
          mode="outlined"
          style={styles.input}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <Text variant="titleMedium" style={[styles.label, { color: textSecondary }]}>Downtime (days, 0 or 1)</Text>
        <TextInput
          value={downtime}
          onChangeText={(t) => setDowntime(t.replace(/\D/g, '').slice(0, 1))}
          mode="outlined"
          style={styles.input}
          keyboardType="number-pad"
        />
        <Text variant="titleMedium" style={[styles.label, { color: textSecondary }]}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={[styles.input, styles.notes]}
          placeholder="Optional notes"
          multiline
          numberOfLines={3}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button mode="contained" onPress={handleSubmit} loading={isLoading} disabled={isLoading} style={styles.button}>
          Save Daily Entry
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  label: { marginTop: 12, marginBottom: 4 },
  input: { marginBottom: 8 },
  notes: { minHeight: 80 },
  hint: { marginBottom: 8 },
  errorText: { color: '#C0392B', marginVertical: 8 },
  button: { marginTop: 24 },
});
