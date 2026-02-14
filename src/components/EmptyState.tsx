import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface EmptyStateProps {
  colors: ColorScheme;
}

export function EmptyState({ colors }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        No accounts yet
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tap the + button to scan a QR code
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
