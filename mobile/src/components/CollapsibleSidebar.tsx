import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../features/auth/store';
import { useSidebarStore, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '../features/sidebar/sidebarStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { colors } from '../theme';

const SPRING_CONFIG = { damping: 20, stiffness: 200 };

export const SIDEBAR_NAV_ITEMS: { name: string; href: string; icon: string; label: string; adminOnly?: boolean }[] = [
  { name: 'dashboard', href: '/(main)/dashboard', icon: 'view-dashboard', label: 'Dashboard' },
  { name: 'daily-entry', href: '/(main)/daily-entry', icon: 'calendar-edit', label: 'Daily Entry' },
  { name: 'vouchers', href: '/(main)/vouchers', icon: 'ticket-percent', label: 'Vouchers' },
  { name: 'reconcile', href: '/(main)/reconcile', icon: 'scale-balance', label: 'Reconcile' },
  { name: 'sales-log', href: '/(main)/sales-log', icon: 'format-list-bulleted', label: 'Sales Log' },
  { name: 'expenses', href: '/(main)/expenses', icon: 'cash-minus', label: 'Expenses' },
  { name: 'assets', href: '/(main)/assets', icon: 'briefcase', label: 'Assets' },
  { name: 'analytics', href: '/(main)/analytics', icon: 'chart-line', label: 'Analytics' },
  { name: 'guide', href: '/(main)/guide', icon: 'book-open-page-variant', label: 'Guide' },
  { name: 'admin-dashboard', href: '/(main)/admin-dashboard', icon: 'shield-account', label: 'Admin', adminOnly: true },
  { name: 'settings', href: '/(main)/settings', icon: 'cog', label: 'Settings' },
];

interface CollapsibleSidebarProps {
  isOverlay?: boolean;
  overlayWidth?: number;
  surfaceColor?: string;
}

export function CollapsibleSidebar({ isOverlay, overlayWidth = 260, surfaceColor }: CollapsibleSidebarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { surface, textPrimary, textSecondary, borderSubtle } = useAppTheme();
  const { collapsed, toggle, setOpen, widthExpanded, widthCollapsed } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.permissions === 'all';
  const sidebarBg = surfaceColor ?? surface;

  const effectiveWidth = isOverlay ? overlayWidth! : (collapsed ? widthCollapsed : widthExpanded);
  const width = useSharedValue(effectiveWidth);
  const labelOpacity = useSharedValue(isOverlay ? 1 : (collapsed ? 0 : 1));

  useEffect(() => {
    if (isOverlay) {
      width.value = overlayWidth!;
      labelOpacity.value = 1;
    } else {
      width.value = withSpring(collapsed ? widthCollapsed : widthExpanded, SPRING_CONFIG);
      labelOpacity.value = withTiming(collapsed ? 0 : 1, { duration: 200 });
    }
  }, [isOverlay, overlayWidth, collapsed, widthCollapsed, widthExpanded]);

  const sidebarAnimatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const filteredNavItems = SIDEBAR_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Animated.View style={[styles.sidebar, { backgroundColor: sidebarBg, borderRightColor: borderSubtle }, !isOverlay && sidebarAnimatedStyle, isOverlay && { width: overlayWidth }, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="wifi" size={24} color={colors.accent} />
          </View>
          <Animated.Text style={[styles.logoText, labelAnimatedStyle, { color: textPrimary }]} numberOfLines={1}>
            SureLink
          </Animated.Text>
        </View>
        {isOverlay ? (
          <Pressable onPress={() => setOpen(false)} style={styles.collapseBtn} hitSlop={8} accessibilityLabel="Close menu">
            <MaterialCommunityIcons name="close" size={24} color={textSecondary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => toggle(false)}
            style={styles.collapseBtn}
            hitSlop={8}
            accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <MaterialCommunityIcons
              name={collapsed ? 'chevron-right' : 'chevron-left'}
              size={24}
              color={textSecondary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.nav}>
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === `/(main)/${item.name}` || pathname.endsWith(`/${item.name}`);
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => {
                router.push(item.href as any);
                setOpen(false);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? textPrimary : textSecondary}
                />
              </View>
              <Animated.Text
                style={[styles.navLabel, isActive && styles.navLabelActive, labelAnimatedStyle, { color: isActive ? textPrimary : textSecondary }, isActive && { fontWeight: '600' }]}
                numberOfLines={1}
              >
                {item.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: borderSubtle }]}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => {
            router.push('/(main)/user');
            setOpen(false);
          }}
          activeOpacity={0.7}
          accessibilityLabel="Open my profile"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText} numberOfLines={1}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Animated.Text style={[styles.userName, labelAnimatedStyle, { color: textSecondary }]} numberOfLines={1}>
            {user?.name || 'User'}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 1,
    minHeight: '100%',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#eee',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  collapseBtn: {
    padding: 4,
  },
  nav: {
    flex: 1,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 2,
    borderRadius: 10,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: '#6366f1',
  },
  navLabel: {
    fontSize: 14,
    flex: 1,
  },
  navLabelActive: {},
  footer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    flex: 1,
  },
});
