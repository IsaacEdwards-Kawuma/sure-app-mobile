/**
 * Session timeout: when app returns from background after autoLockMinutes,
 * show "Extend or Log out" dialog. On log out, reset API cache and redirect.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useAuthStore } from '../features/auth/store';
import { logout as reduxLogout } from '../features/auth/authSlice';
import { useAppPreferencesStore } from '../features/appPreferences/store';
import { baseApi } from '../api/baseApi';
import { store } from '../store';

const MS_PER_MINUTE = 60 * 1000;

export function useInactivityLock() {
  const router = useRouter();
  const dispatch = useDispatch();
  const autoLockMinutes = useAppPreferencesStore((s) => s.autoLockMinutes);
  const logoutZustand = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const backgroundedAt = useRef<number | null>(null);
  const dialogShown = useRef(false);

  const performLogout = async () => {
    store.dispatch(baseApi.util.resetApiState());
    dispatch(reduxLogout());
    await logoutZustand();
    router.replace('/login');
  };

  useEffect(() => {
    if (!token || autoLockMinutes === 0) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
        dialogShown.current = false;
      }
      if (nextState === 'active') {
        const at = backgroundedAt.current;
        if (at == null) return;
        const elapsed = (Date.now() - at) / MS_PER_MINUTE;
        if (elapsed >= autoLockMinutes && !dialogShown.current) {
          dialogShown.current = true;
          const mins = Math.floor(elapsed);
          const message =
            mins <= 1
              ? 'You\'ve been away. Extend your session or log out?'
              : `You've been away for ${mins} minutes. Extend your session or log out?`;
          Alert.alert('Session timeout', message, [
            { text: 'Extend', onPress: () => { backgroundedAt.current = null; } },
            {
              text: 'Log out',
              style: 'destructive',
              onPress: performLogout,
            },
          ]);
        }
        backgroundedAt.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [token, autoLockMinutes, dispatch, router, logoutZustand]);
}
