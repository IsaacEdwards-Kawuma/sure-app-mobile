/**
 * API base URL (connection string) for remote mode.
 * Stored in SecureStore (device keychain) so only the app can read it — admin sets it in Admin dashboard only.
 * Fallback: EXPO_PUBLIC_API_URL from .env, then http://localhost:3000
 */
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'surelink_api_url';

const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Returns the API base URL (no trailing slash). Uses stored value if set, else .env or default.
 */
export async function getApiBaseUrl(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim().replace(/\/+$/, '');
    }
  } catch (_) {}
  return DEFAULT_URL.replace(/\/+$/, '');
}

/**
 * Save the API base URL (connection string). Admin-only; stored securely.
 */
export async function setApiBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed) {
    await SecureStore.setItemAsync(STORAGE_KEY, trimmed);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

/**
 * Clear the stored URL so the app falls back to .env / default.
 */
export async function clearApiBaseUrl(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

/**
 * Synchronous fallback for initial load. Prefer getApiBaseUrl() when you can await.
 */
export function getDefaultApiBaseUrl(): string {
  return DEFAULT_URL.replace(/\/+$/, '');
}

/**
 * Return only the stored URL (no fallback). Shown only in Admin dashboard. Returns null if none set.
 */
export async function getStoredApiUrl(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  } catch (_) {
    return null;
  }
}
