import { create } from 'zustand';
import { api } from '../../services/api';
import type {
  SettingsData,
  BusinessSettings,
  RevenueSource,
  VoucherPackage,
  FixedCost,
  ExpenseCategory,
  Subscription,
} from './types';
import type { UserListItem } from './types';
import type { AdminLogEntry } from './types';

const defaultBusiness: BusinessSettings = {
  name: '',
  tagline: '',
  owner: '',
  phone: '',
  addr: '',
};

const defaultSettings: SettingsData = {
  business: { ...defaultBusiness },
  revenue_sources: [],
  voucher_packages: [],
  fixed_costs: [],
  expense_categories: [],
  subscriptions: [],
};

interface SettingsState extends SettingsData {
  users: UserListItem[];
  adminLog: AdminLogEntry[];
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchAdminLog: () => Promise<void>;
  saveBusiness: (b: BusinessSettings) => Promise<void>;
  saveRevenueSources: (r: RevenueSource[]) => Promise<void>;
  saveVoucherPackages: (v: VoucherPackage[]) => Promise<void>;
  saveFixedCosts: (f: FixedCost[]) => Promise<void>;
  saveExpenseCategories: (e: ExpenseCategory[]) => Promise<void>;
  saveSubscriptions: (s: Subscription[]) => Promise<void>;
  clearAdminLog: () => Promise<void>;
  setSettings: (s: Partial<SettingsData>) => void;
  setUsers: (u: UserListItem[]) => void;
  setAdminLog: (a: AdminLogEntry[]) => void;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  users: [],
  adminLog: [],
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<SettingsData>('/settings');
      set({
        business: data.business ?? defaultSettings.business,
        revenue_sources: data.revenue_sources ?? [],
        voucher_packages: data.voucher_packages ?? [],
        fixed_costs: data.fixed_costs ?? [],
        expense_categories: data.expense_categories ?? [],
        subscriptions: data.subscriptions ?? [],
        loading: false,
      });
    } catch (e: unknown) {
      set({
        error: (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to load settings',
        loading: false,
      });
    }
  },

  fetchUsers: async () => {
    try {
      const { data } = await api.get<{ users: UserListItem[] }>('/users');
      set({ users: data.users ?? [] });
    } catch {
      set({ users: [] });
    }
  },

  fetchAdminLog: async () => {
    try {
      const { data } = await api.get<{ entries: AdminLogEntry[] }>('/admin-log?limit=300');
      set({ adminLog: data.entries ?? [] });
    } catch {
      set({ adminLog: [] });
    }
  },

  saveBusiness: async (business) => {
    await api.put('/settings/business', business);
    set({ business });
  },

  saveRevenueSources: async (revenue_sources) => {
    await api.put('/settings/revenue_sources', revenue_sources);
    set({ revenue_sources });
  },

  saveVoucherPackages: async (voucher_packages) => {
    await api.put('/settings/voucher_packages', voucher_packages);
    set({ voucher_packages });
  },

  saveFixedCosts: async (fixed_costs) => {
    await api.put('/settings/fixed_costs', fixed_costs);
    set({ fixed_costs });
  },

  saveExpenseCategories: async (expense_categories) => {
    await api.put('/settings/expense_categories', expense_categories);
    set({ expense_categories });
  },

  saveSubscriptions: async (subscriptions) => {
    await api.put('/settings/subscriptions', subscriptions);
    set({ subscriptions });
  },

  clearAdminLog: async () => {
    await api.delete('/admin-log');
    set({ adminLog: [] });
  },

  setSettings: (s) => set(s),
  setUsers: (users) => set({ users }),
  setAdminLog: (adminLog) => set({ adminLog }),
  clearError: () => set({ error: null }),
}));
