import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isNarrow = width < BREAKPOINTS.sm;
    const isMedium = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
    const isWide = width >= BREAKPOINTS.md;
    const isShort = height < 500;

    const spacing = {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      screenHorizontal: width < BREAKPOINTS.sm ? 16 : width < BREAKPOINTS.md ? 20 : 24,
      screenVertical: 16,
    };

    const fontScale = Math.min(1.2, Math.max(0.9, width / 400));
    const scale = (n: number) => Math.round(n * fontScale);

    return {
      width,
      height,
      isNarrow,
      isMedium,
      isWide,
      isShort,
      breakpoints: BREAKPOINTS,
      spacing,
      scale,
      // For KPI cards etc: min width that fits 2 on narrow, more on wide
      cardMinWidth: isNarrow ? 130 : isMedium ? 140 : 160,
      numColumns: isNarrow ? 2 : isMedium ? 3 : 4,
    };
  }, [width, height]);
}

export type Responsive = ReturnType<typeof useResponsive>;
