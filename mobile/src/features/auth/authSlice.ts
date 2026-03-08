/**
 * Redux auth slice — token and user for RTK Query prepareHeaders.
 * Synced with expo-secure-store on login/register/logout.
 */
import { createSlice } from '@reduxjs/toolkit';

export interface User {
  id: number;
  name: string;
  role: string;
  permissions: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: { payload: { token: string; user: User } | { token: null; user: null } }) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
