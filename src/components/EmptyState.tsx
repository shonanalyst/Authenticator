import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface EmptyStateProps {
  colors: ColorScheme;
}

export function EmptyState({ colors }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2l7 4v5c0 5.25-3.5 10-7 11.5C8.5 21 5 16.25 5 11V6l7-4z"
            stroke={colors.textSecondary}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Path
            d="M9 12l2 2 4-4"
            stroke={colors.textSecondary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        No accounts yet
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tap the + button to scan a QR code and add your first account
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
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
