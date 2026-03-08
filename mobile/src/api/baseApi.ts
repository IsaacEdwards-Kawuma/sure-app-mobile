/**
 * RTK Query base API — remote PostgreSQL API only.
 * API URL from stored connection string (Settings) or EXPO_PUBLIC_API_URL.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import { getApiBaseUrl } from '../config/apiUrl';

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
  return fetchQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryRemote,
  tagTypes: ['Auth', 'User', 'Settings', 'Sales', 'Vouchers', 'Expenses', 'Assets', 'AdminLog'],
  endpoints: () => ({}),
});
