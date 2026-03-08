import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CollapsibleSidebar } from '../../src/components/CollapsibleSidebar';
import { MainHeader } from '../../src/components/MainHeader';
import { useSidebarStore } from '../../src/features/sidebar/sidebarStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useInactivityLock } from '../../src/hooks/useInactivityLock';

const SIDEBAR_OVERLAY_WIDTH = 260;

export default function MainLayout() {
  const { width } = useWindowDimensions();
  const { open, setOpen } = useSidebarStore();
  const { background, surface } = useAppTheme();
  const isNarrow = width < 480;

  useInactivityLock();

  const translateX = useSharedValue(open ? 0 : -SIDEBAR_OVERLAY_WIDTH);
  useEffect(() => {
    translateX.value = withTiming(open ? 0 : -SIDEBAR_OVERLAY_WIDTH, { duration: 200 });
  }, [open]);

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {isNarrow ? (
        <>
          <View style={styles.content}>
            <MainHeader />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: background, flex: 1 },
              }}
            />
          </View>
          {open && (
            <Pressable
              style={[StyleSheet.absoluteFill, styles.backdrop]}
              onPress={() => setOpen(false)}
              accessibilityLabel="Close menu"
              accessibilityRole="button"
            />
          )}
          <Animated.View
            style={[
              styles.sidebarOverlay,
              overlayStyle,
              { width: SIDEBAR_OVERLAY_WIDTH, zIndex: 11, backgroundColor: surface },
            ]}
            pointerEvents={open ? 'auto' : 'none'}
          >
            <CollapsibleSidebar isOverlay overlayWidth={SIDEBAR_OVERLAY_WIDTH} surfaceColor={surface} />
          </Animated.View>
        </>
      ) : (
        <>
          <CollapsibleSidebar surfaceColor={surface} />
          <View style={styles.content}>
            <MainHeader />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: background, flex: 1 },
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  sidebarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
});
