/**
 * Animated count-up from 0 to value (spec: Dashboard numbers count up).
 */
import React, { useEffect, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text } from 'react-native-paper';

const STEPS = 30;

export function CountUpNumber({
  value,
  duration = 800,
  format = (n: number) => n.toLocaleString(),
  variant = 'headlineSmall',
  style,
  ...rest
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  variant?: 'headlineSmall' | 'titleMedium' | 'bodyLarge';
  style?: object;
  [key: string]: unknown;
}) {
  const [display, setDisplay] = useState(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    const step = value / STEPS;
    const inc = duration / STEPS;
    let current = 0;
    const id = setInterval(() => {
      current += step;
      if (current >= value) {
        setDisplay(value);
        clearInterval(id);
      } else {
        setDisplay(Math.round(current));
      }
    }, inc);
    return () => clearInterval(id);
  }, [value, duration]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      <Text variant={variant} style={style} {...rest}>
        {format(display)}
      </Text>
    </Animated.View>
  );
}
