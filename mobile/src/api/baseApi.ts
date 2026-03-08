/**
 * RTK Query base API — remote PostgreSQL API only.
 * On 401, clears token and syncs auth state so app can redirect to login.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import { getApiBaseUrl } from '../config/apiUrl';
import { clearStoredToken } from '../services/api';
import { useAuthStore } from '../features/auth/store';
import { logout as logoutAction } from '../features/auth/authSlice';

const baseQueryRemote: BaseQueryFn = async (args, api, extraOptions) => {
  const API_BASE = await getApiBaseUrl();
  const fetchQuery = fetchBaseQuery({
    baseUrl: `${API_BASE}/api`,
    prepareHeaders: async (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  });
  const result = await fetchQuery(args, api, extraOptions);
  if (result.error && (result.error as { status?: number }).status === 401) {
    await clearStoredToken();
    useAuthStore.setState({ token: null, user: null });
    api.dispatch(logoutAction());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryRemote,
  tagTypes: ['Auth', 'User', 'Settings', 'Sales', 'Vouchers', 'Expenses', 'Assets', 'AdminLog'],
  endpoints: () => ({}),
});
