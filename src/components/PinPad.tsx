import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PinPadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  onSubmit: () => void;
  targetLength: number;
  colors: ColorScheme;
  disabled?: boolean;
}

export function PinPad({ pin, onPinChange, onSubmit, targetLength, colors, disabled }: PinPadProps) {
  const handleDigit = useCallback((digit: string) => {
    if (disabled) return;
    const next = pin + digit;
    if (next.length > targetLength) return;
    onPinChange(next);
    if (next.length === targetLength) {
      setTimeout(() => onSubmit(), 100);
    }
  }, [pin, onPinChange, onSubmit, targetLength, disabled]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    onPinChange(pin.slice(0, -1));
  }, [pin, onPinChange, disabled]);

  const dots = Array.from({ length: targetLength }, (_, i) => (
    <View
      key={i}
      style={[
        styles.dot,
        {
          backgroundColor: i < pin.length ? colors.accent : 'transparent',
          borderColor: i < pin.length ? colors.accent : colors.textSecondary,
        },
      ]}
    />
  ));

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'back'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.dots}>{dots}</View>

      <View style={styles.keypad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => {
              if (key === '') {
                return <View key={ki} style={styles.key} />;
              }
              if (key === 'back') {
                return (
                  <Pressable
                    key={ki}
                    onPress={handleBackspace}
                    disabled={disabled}
                    style={({ pressed }) => [
                      styles.key,
                      { opacity: pressed ? 0.5 : disabled ? 0.3 : 1 },
                    ]}
                  >
                    <Text style={[styles.backspaceText, { color: colors.textPrimary }]}>⌫</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={ki}
                  onPress={() => handleDigit(key)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: pressed ? colors.surface : 'transparent',
                      opacity: disabled ? 0.3 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.keyText, { color: colors.textPrimary }]}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const KEY_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  keypad: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
  },
  backspaceText: {
    fontSize: 24,
  },
});
