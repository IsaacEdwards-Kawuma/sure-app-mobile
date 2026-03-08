/**
 * RTK Query — settings and dashboard data.
 */
import { baseApi } from './baseApi';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    settings: build.query<Record<string, unknown>, void>({
      query: () => ({ url: 'settings' }),
      providesTags: ['Settings'],
    }),
  }),
});

export const { useSettingsQuery } = settingsApi;
