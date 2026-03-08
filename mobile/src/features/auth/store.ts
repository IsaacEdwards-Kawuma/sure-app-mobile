import { create } from 'zustand';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../../services/api';

export interface User {
  id: number;
  name: string;
  role: string;
  permissions: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  users: { id: number; name: string; role: string; active: boolean }[];
  isLoading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  login: (userId: number, pin: string) => Promise<boolean>;
  register: (name: string, pin: string, role?: 'user' | 'admin') => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  users: [],
  isLoading: true,
  error: null,

  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await getStoredToken();
      if (!token) {
        set({ token: null, user: null, isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      set({ token, user: data.user, isLoading: false });
    } catch {
      await clearStoredToken();
      set({ token: null, user: null, isLoading: false });
    }
  },

  login: async (userId: number, pin: string) => {
    set({ error: null });
    try {
      const { data } = await api.post('/auth/login', { userId, pin });
      await setStoredToken(data.token);
      set({ token: data.token, user: data.user });
      return true;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; code?: string; message?: string };
      let message = ax?.response?.data?.error || ax?.message || 'Login failed';
      if (!ax?.response) {
        const code = ax?.code ?? '';
        const isNetwork = code === 'ECONNREFUSED' || code === 'ERR_NETWORK' || code === 'ECONNABORTED' || ax?.message?.includes('Network') || ax?.message?.includes('timeout');
        if (isNetwork) {
          message = "Can't reach server. The backend may be waking up (Render free tier). Wait 30–60 seconds and try again. Check your internet connection.";
        }
      }
      set({ error: message });
      return false;
    }
  },

  register: async (name: string, pin: string, role: 'user' | 'admin' = 'user') => {
    set({ error: null });
    try {
      const { data } = await api.post('/auth/register', { name: name.trim(), pin, role });
      await setStoredToken(data.token);
      set({ token: data.token, user: data.user });
      return true;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; code?: string; message?: string };
      let message = ax?.response?.data?.error || ax?.message || 'Sign up failed';
      if (!ax?.response) {
        const code = ax?.code ?? '';
        const isNetwork = code === 'ECONNREFUSED' || code === 'ERR_NETWORK' || code === 'ECONNABORTED' || ax?.message?.includes('Network') || ax?.message?.includes('timeout');
        if (isNetwork) {
          message = "Can't reach server. The backend may be waking up (Render free tier). Wait 30–60 seconds and try again. Check your internet connection.";
        }
      }
      set({ error: message });
      return false;
    }
  },

  logout: async () => {
    await clearStoredToken();
    set({ token: null, user: null });
  },

  fetchUsers: async () => {
    try {
      const { data } = await api.get('/users');
      set({ users: data.users || [] });
    } catch {
      set({ users: [] });
    }
  },

  clearError: () => set({ error: null }),
}));
