import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ColorScheme } from '../theme/colors';
import { typography } from '../theme/typography';

interface CountdownTimerProps {
  secondsRemaining: number;
  colors: ColorScheme;
}

const WARNING_THRESHOLD = 5;

export function CountdownTimer({ secondsRemaining, colors }: CountdownTimerProps) {
  const isWarning = secondsRemaining <= WARNING_THRESHOLD;
  const color = isWarning ? colors.warning : colors.textSecondary;

  return (
    <Text style={[styles.text, typography.countdown, { color }]}>
      {secondsRemaining}s remaining
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});
