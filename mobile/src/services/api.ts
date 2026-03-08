import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../config/apiUrl';

// 60s timeout so Render free tier has time to wake (cold start can take 30–60s)
export const api = axios.create({
  baseURL: 'https://sure-app-mobile.onrender.com/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'surelink_jwt';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
  const baseUrl = await getApiBaseUrl();
  config.baseURL = `${baseUrl}/api`;
  const token = await getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearStoredToken();
    }
    return Promise.reject(err);
  }
);
