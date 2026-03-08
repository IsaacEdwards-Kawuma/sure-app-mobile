export interface BusinessSettings {
  name: string;
  tagline: string;
  owner: string;
  phone: string;
  addr: string;
  logo?: string;
}

export interface RevenueSource {
  id: string;
  name: string;
  key: string;
  inputType: 'direct' | 'count';
  price?: number;
  active: boolean;
}

export interface VoucherPackage {
  id: string;
  name: string;
  price: number;
  duration: number;
  durUnit: 'Hours' | 'Days';
  active: boolean;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  freq: 'monthly' | 'quarterly' | 'annual';
  note?: string;
  active: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  subs: string[];
  active: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  freq: string;
  next_due?: string;
  alert_days?: number;
  notes?: string;
  active: boolean;
}

export interface SettingsData {
  business: BusinessSettings;
  revenue_sources: RevenueSource[];
  voucher_packages: VoucherPackage[];
  fixed_costs: FixedCost[];
  expense_categories: ExpenseCategory[];
  subscriptions: Subscription[];
}

export interface UserListItem {
  id: number;
  name: string;
  role: string;
  permissions: string | string[];
  active: boolean;
  id_number?: string;
  phone?: string;
  created_at?: string;
}

export interface AdminLogEntry {
  id: number;
  action: string;
  details: unknown;
  user_id: number | null;
  user_name: string | null;
  created_at: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export { uid };
