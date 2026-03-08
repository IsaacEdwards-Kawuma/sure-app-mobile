import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMeQuery } from '../../src/api/authApi';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary, borderSubtle } = useAppTheme();
  const { data, refetch, isFetching } = useMeQuery();
  const user = data?.user;

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: background }]}>
        <Text variant="bodyMedium" style={[styles.muted, { color: textSecondary }]}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text variant="titleMedium" style={[styles.title, { color: textPrimary }]}>My profile</Text>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text variant="titleLarge" style={[styles.name, { color: textPrimary }]}>{user.name}</Text>
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>User ID: {user.id}</Text>
              <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>Role: {user.role}</Text>
              {user.permissions && (
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>Permissions: {user.permissions}</Text>
              )}
              {user.phone ? (
                <Text variant="bodySmall" style={[styles.phone, { color: textSecondary }]}>Phone: {user.phone}</Text>
              ) : null}
              {user.created_at && (
                <Text variant="bodySmall" style={[styles.muted, { color: textSecondary }]}>
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.userOptionsRow, { borderTopColor: borderSubtle }]}
            onPress={() => router.push('/(main)/user')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-cog" size={22} color={colors.accent} style={styles.featureIcon} />
            <Text variant="bodyLarge" style={[styles.featureLabel, { color: textPrimary }]}>User options</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={textSecondary} />
          </TouchableOpacity>
        </Card.Content>
      </Card>
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
  userOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
  },
  featureIcon: { marginRight: 12 },
  featureLabel: { flex: 1 },
});
