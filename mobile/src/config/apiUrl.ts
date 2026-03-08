/**
 * API base URL for the backend. Stored in SecureStore if set in app; else .env or default.
 * Default: Render backend at https://sure-app-mobile.onrender.com
 */
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'surelink_api_url';

const RENDER_URL = 'https://sure-app-mobile.onrender.com';
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || RENDER_URL;

function isLocalOrInvalidUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.startsWith('http://localhost') ||
    u.startsWith('http://127.0.0.1') ||
    u.startsWith('http://10.0.2.2') ||
    u.startsWith('http://192.168.') ||
    u.startsWith('http://10.') ||
    u.length < 10
  );
}

/**
 * Returns the API base URL (no trailing slash). Uses stored value only if it's a real remote URL; otherwise Render default.
 */
export async function getApiBaseUrl(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    if (stored && stored.trim()) {
      const trimmed = stored.trim().replace(/\/+$/, '');
      if (!isLocalOrInvalidUrl(trimmed)) {
        return trimmed;
      }
      await SecureStore.deleteItemAsync(STORAGE_KEY);
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
