import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressRing } from './ProgressRing';
import { OtpDisplay } from './OtpDisplay';
import { CountdownTimer } from './CountdownTimer';
import { IssuerLabel } from './IssuerLabel';
import { useTotp } from '../hooks/useTotp';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface AuthenticatorCardProps {
  secret: string;
  issuer: string;
  account?: string;
  colors: ColorScheme;
}

export function AuthenticatorCard({
  secret,
  issuer,
  account,
  colors,
}: AuthenticatorCardProps) {
  const { code, secondsRemaining, progress } = useTotp(secret);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      <IssuerLabel issuer={issuer} account={account} colors={colors} />

      <ProgressRing
        progress={progress}
        secondsRemaining={secondsRemaining}
        colors={colors}
        size={200}
        strokeWidth={5}
      >
        <OtpDisplay code={code} colors={colors} />
      </ProgressRing>

      <CountdownTimer secondsRemaining={secondsRemaining} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
});
