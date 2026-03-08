import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { useSidebarStore } from '../features/sidebar/sidebarStore';
import { useAppTheme } from '../hooks/useAppTheme';

export const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'daily-entry': 'Daily Entry',
  vouchers: 'Vouchers',
  reconcile: 'Reconcile',
  'sales-log': 'Sales Log',
  expenses: 'Expenses',
  assets: 'Assets',
  analytics: 'Analytics',
  guide: 'Guide',
  profile: 'My profile',
  user: 'User',
  settings: 'Settings',
};

export function MainHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;
  const { collapsed, toggle } = useSidebarStore();
  const { background, isDark } = useAppTheme();
  const textColor = isDark ? '#fff' : 'rgba(0,0,0,0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const title = getHeaderTitle(pathname);
  const handleMenuPress = () => toggle(isNarrow);

  return (
    <View style={[styles.header, { backgroundColor: background, borderBottomColor: borderColor, paddingTop: insets.top + 8, paddingHorizontal: width < 480 ? 12 : 16 }]}>
      <TouchableOpacity onPress={handleMenuPress} style={styles.menuBtn} hitSlop={8}>
        <MaterialCommunityIcons
          name={collapsed ? 'menu-open' : 'menu'}
          size={24}
          color={textColor}
        />
      </TouchableOpacity>
      <Text variant="titleLarge" style={[styles.title, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.placeholder} />
    </View>
  );
}

export function getHeaderTitle(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  return TITLES[segment] || 'SureLink';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  menuBtn: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
});
