import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useAuthStore } from '../src/features/auth/store';
import { setCredentials } from '../src/features/auth/authSlice';
import { useFirstRunQuery } from '../src/api/authApi';
import { useDataSourceStore } from '../src/features/dataSource/store';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { background } = useAppTheme();
  const { token, isLoading, checkAuth } = useAuthStore();
  const tokenFromZustand = useAuthStore((s) => s.token);
  const dataSourceHydrated = useDataSourceStore((s) => s.hydrated);
  const hydrateDataSource = useDataSourceStore((s) => s.hydrate);
  const { data: firstRunData, isLoading: firstRunLoading } = useFirstRunQuery(undefined, { skip: !!tokenFromZustand });

  useEffect(() => {
    hydrateDataSource();
  }, [hydrateDataSource]);

  useEffect(() => {
    if (!dataSourceHydrated) return;
    (async () => {
      await checkAuth();
      const t = useAuthStore.getState().token;
      const user = useAuthStore.getState().user;
      if (t && user) dispatch(setCredentials({ token: t, user }));
    })();
  }, [dataSourceHydrated, dispatch, checkAuth]);

  useEffect(() => {
    if (!dataSourceHydrated) return;
    if (isLoading) return;
    const t = useAuthStore.getState().token;
    if (t) {
      router.replace('/(main)/dashboard');
      return;
    }
    if (firstRunLoading === false) {
      if (firstRunData?.firstRun) router.replace('/signup');
      else router.replace('/login');
    }
  }, [isLoading, firstRunLoading, firstRunData?.firstRun, token, dataSourceHydrated]);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ActivityIndicator size="large" color="#C9A84C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
