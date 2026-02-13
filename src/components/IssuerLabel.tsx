import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorScheme } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface IssuerLabelProps {
  issuer: string;
  account?: string;
  colors: ColorScheme;
}

export function IssuerLabel({ issuer, account, colors }: IssuerLabelProps) {
  return (
    <View style={styles.container}>
      <Text style={[typography.issuer, { color: colors.textPrimary }]}>
        {issuer}
      </Text>
      {account ? (
        <Text
          style={[
            typography.label,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          {account}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
