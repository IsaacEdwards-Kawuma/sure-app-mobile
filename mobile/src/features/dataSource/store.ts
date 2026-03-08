/**
 * Data source: always remote API (PostgreSQL). Local DB option removed.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@surelink_use_local_db';

interface DataSourceState {
  hydrated: boolean;
  /** @deprecated Always false; kept so selectors don't throw. */
  useLocalDb: boolean;
  hydrate: () => Promise<void>;
}

export const useDataSourceStore = create<DataSourceState>((set) => ({
  hydrated: false,
  useLocalDb: false,

  hydrate: async () => {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
    set({ hydrated: true });
  },
}));

/** Always false — app uses PostgreSQL via API only. */
export function getUseLocalDb(): boolean {
  return false;
}
