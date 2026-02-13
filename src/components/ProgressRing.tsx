import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ColorScheme } from '../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WARNING_THRESHOLD = 5;

interface ProgressRingProps {
  progress: number;
  secondsRemaining: number;
  size?: number;
  strokeWidth?: number;
  colors: ColorScheme;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  secondsRemaining,
  size = 200,
  strokeWidth = 5,
  colors,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    if (progress < 0.05) {
      animatedProgress.value = 0;
      animatedProgress.value = withTiming(progress, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedProgress.value = withTiming(progress, {
        duration: 1000,
        easing: Easing.linear,
      });
    }
  }, [progress, animatedProgress]);

  const animatedStrokeProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const isWarning = secondsRemaining <= WARNING_THRESHOLD;
  const trackColor = isWarning ? colors.warningDim : colors.accentDim;
  const activeColor = isWarning ? colors.warning : colors.accent;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedStrokeProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  childrenContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
