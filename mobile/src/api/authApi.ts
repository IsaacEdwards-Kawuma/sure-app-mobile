/**
 * RTK Query — auth and first-run endpoints.
 */
import { baseApi } from './baseApi';

export interface LoginRequest {
  userId: number;
  pin: string;
}
export interface RegisterRequest {
  name: string;
  pin: string;
}
export interface AuthUser {
  id: number;
  name: string;
  role: string;
  permissions: string;
  id_number?: string | null;
  phone?: string | null;
  created_at?: string;
  /** Optional profile image URL (if backend supports it). */
  avatar_url?: string | null;
}
export interface AuthResponse {
  token: string;
  user: AuthUser;
}
export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  current_pin?: string;
  new_pin?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    firstRun: build.query<{ firstRun: boolean }, void>({
      query: () => ({ url: 'auth/first-run' }),
      providesTags: ['Auth'],
    }),
    authUsers: build.query<{ users: { id: number; name: string; role: string; active: number | boolean }[] }, void>({
      query: () => ({ url: 'auth/users' }),
      providesTags: ['User'],
    }),
    me: build.query<{ user: AuthUser }, void>({
      query: () => ({ url: 'auth/me' }),
      providesTags: ['Auth'],
    }),
    updateProfile: build.mutation<{ user: AuthUser }, UpdateProfileInput>({
      query: (body) => ({ url: 'auth/me', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useFirstRunQuery, useAuthUsersQuery, useMeQuery, useUpdateProfileMutation, useLoginMutation, useRegisterMutation } = authApi;
