import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/features/auth/store';
import { useAppTheme } from '../../src/hooks/useAppTheme';

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.permissions === 'all';
  const { background, surface, textPrimary, textSecondary } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: textSecondary,
        tabBarStyle: { backgroundColor: surface },
        headerStyle: { backgroundColor: background },
        headerTintColor: textPrimary,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="daily-entry"
        options={{
          title: 'Daily Entry',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-edit" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vouchers"
        options={{
          title: 'Vouchers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket-percent" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reconcile"
        options={{
          title: 'Reconcile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scale-balance" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales-log"
        options={{
          title: 'Sales Log',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-minus" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Guide',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-page-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
          href: isAdmin ? '/settings' : null,
        }}
      />
    </Tabs>
  );
}
