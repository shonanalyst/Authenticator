import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ColorScheme } from '../theme/colors';
import { typography } from '../theme/typography';

interface OtpDisplayProps {
  code: string;
  colors: ColorScheme;
}

function formatCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}

export function OtpDisplay({ code, colors }: OtpDisplayProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (code === '------') return;
    opacity.value = withSequence(
      withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 300, easing: Easing.in(Easing.cubic) }),
    );
  }, [code, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[styles.code, typography.codeDisplay, { color: colors.textPrimary }, animatedStyle]}
    >
      {formatCode(code)}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  code: {
    textAlign: 'center',
  },
});
