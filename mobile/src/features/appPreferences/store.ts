/**
 * App preferences: security, biometrics, notifications, warnings.
 * Persisted to AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@surelink_app_preferences';

export type AutoLockMinutes = 0 | 1 | 5 | 15 | 30;

export interface AppPreferences {
  // Security
  requirePinOnLaunch: boolean;
  autoLockMinutes: AutoLockMinutes;
  // Biometrics
  biometricsEnabled: boolean;
  // Notifications
  notificationsEnabled: boolean;
  notificationSubscriptionAlerts: boolean;
  notificationDailyReminder: boolean;
  notificationRevenueAlert: boolean;
  // Warnings
  warningLowBalanceThreshold: number;
  warningDowntimeDays: number;
  warningShowOverdueSubscriptions: boolean;
  warningRevenueBelowThreshold: boolean;
}

const defaults: AppPreferences = {
  requirePinOnLaunch: false,
  autoLockMinutes: 5,
  biometricsEnabled: false,
  notificationsEnabled: true,
  notificationSubscriptionAlerts: true,
  notificationDailyReminder: false,
  notificationRevenueAlert: true,
  warningLowBalanceThreshold: 50000,
  warningDowntimeDays: 3,
  warningShowOverdueSubscriptions: true,
  warningRevenueBelowThreshold: true,
};

interface AppPreferencesState extends AppPreferences {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setRequirePinOnLaunch: (v: boolean) => Promise<void>;
  setAutoLockMinutes: (v: AutoLockMinutes) => Promise<void>;
  setBiometricsEnabled: (v: boolean) => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setNotificationSubscriptionAlerts: (v: boolean) => Promise<void>;
  setNotificationDailyReminder: (v: boolean) => Promise<void>;
  setNotificationRevenueAlert: (v: boolean) => Promise<void>;
  setWarningLowBalanceThreshold: (v: number) => Promise<void>;
  setWarningDowntimeDays: (v: number) => Promise<void>;
  setWarningShowOverdueSubscriptions: (v: boolean) => Promise<void>;
  setWarningRevenueBelowThreshold: (v: boolean) => Promise<void>;
  setMultiple: (patch: Partial<AppPreferences>) => Promise<void>;
}

async function persist(prefs: AppPreferences) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export const useAppPreferencesStore = create<AppPreferencesState>((set, get) => ({
  ...defaults,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppPreferences>;
        set({ ...defaults, ...parsed, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setRequirePinOnLaunch: async (v) => {
    const next = { ...get(), requirePinOnLaunch: v };
    set(next);
    await persist(next);
  },
  setAutoLockMinutes: async (v) => {
    const next = { ...get(), autoLockMinutes: v };
    set(next);
    await persist(next);
  },
  setBiometricsEnabled: async (v) => {
    const next = { ...get(), biometricsEnabled: v };
    set(next);
    await persist(next);
  },
  setNotificationsEnabled: async (v) => {
    const next = { ...get(), notificationsEnabled: v };
    set(next);
    await persist(next);
  },
  setNotificationSubscriptionAlerts: async (v) => {
    const next = { ...get(), notificationSubscriptionAlerts: v };
    set(next);
    await persist(next);
  },
  setNotificationDailyReminder: async (v) => {
    const next = { ...get(), notificationDailyReminder: v };
    set(next);
    await persist(next);
  },
  setNotificationRevenueAlert: async (v) => {
    const next = { ...get(), notificationRevenueAlert: v };
    set(next);
    await persist(next);
  },
  setWarningLowBalanceThreshold: async (v) => {
    const next = { ...get(), warningLowBalanceThreshold: Math.max(0, v) };
    set(next);
    await persist(next);
  },
  setWarningDowntimeDays: async (v) => {
    const next = { ...get(), warningDowntimeDays: Math.max(0, v) };
    set(next);
    await persist(next);
  },
  setWarningShowOverdueSubscriptions: async (v) => {
    const next = { ...get(), warningShowOverdueSubscriptions: v };
    set(next);
    await persist(next);
  },
  setWarningRevenueBelowThreshold: async (v) => {
    const next = { ...get(), warningRevenueBelowThreshold: v };
    set(next);
    await persist(next);
  },
  setMultiple: async (patch) => {
    const next = { ...get(), ...patch };
    set(next);
    await persist(next);
  },
}));

export function getAppPreferences(): AppPreferences {
  const s = useAppPreferencesStore.getState();
  return {
    requirePinOnLaunch: s.requirePinOnLaunch,
    autoLockMinutes: s.autoLockMinutes,
    biometricsEnabled: s.biometricsEnabled,
    notificationsEnabled: s.notificationsEnabled,
    notificationSubscriptionAlerts: s.notificationSubscriptionAlerts,
    notificationDailyReminder: s.notificationDailyReminder,
    notificationRevenueAlert: s.notificationRevenueAlert,
    warningLowBalanceThreshold: s.warningLowBalanceThreshold,
    warningDowntimeDays: s.warningDowntimeDays,
    warningShowOverdueSubscriptions: s.warningShowOverdueSubscriptions,
    warningRevenueBelowThreshold: s.warningRevenueBelowThreshold,
  };
}
