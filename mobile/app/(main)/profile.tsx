import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Text, Card } from 'react-native-paper';
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
      <View style={styles.headerRow}>
        <Text variant="titleLarge" style={[styles.title, { color: textPrimary }]}>My profile</Text>
        <View style={[styles.loggedInBadge, { backgroundColor: colors.success + '22' }]}>
          <MaterialCommunityIcons name="account-check" size={16} color={colors.success} />
          <Text variant="labelSmall" style={[styles.loggedInText, { color: colors.success }]}>Currently logged in</Text>
        </View>
      </View>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <View style={styles.profileSection}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>{user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <Text variant="bodyMedium" style={[styles.signedInAs, { color: textSecondary }]}>
              Signed in as <Text style={{ color: textPrimary, fontWeight: '600' }}>{user.name}</Text>
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderSubtle }]} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  title: {},
  loggedInBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
  loggedInText: { fontWeight: '600' },
  card: { marginBottom: 16 },
  profileSection: { alignItems: 'center', marginBottom: 16 },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 8 },
  avatarTextLarge: { color: '#fff', fontWeight: '700', fontSize: 36 },
  signedInAs: { marginTop: 4 },
  divider: { height: 1, marginVertical: 12 },
  userInfo: {},
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
