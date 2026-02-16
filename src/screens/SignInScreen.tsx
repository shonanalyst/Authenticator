import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCloudSync } from '../contexts/CloudSyncContext';
import { spacing } from '../theme/spacing';

interface SignInScreenProps {
  onSkip: () => void;
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
        fill="#FFC107"
      />
      <Path
        d="M5.3 14.7l7.1 5.2C14.1 16.2 18.7 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 15.4 2 8.1 7.3 5.3 14.7z"
        fill="#FF3D00"
      />
      <Path
        d="M24 46c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.5C29.5 37.5 26.9 38.5 24 38.5c-6 0-11.1-4-12.9-9.5l-7 5.4C7 41 14.7 46 24 46z"
        fill="#4CAF50"
      />
      <Path
        d="M44.5 20H24v8.5h11.8c-1 3-3 5.5-5.6 7.1l6.5 5.5C40.5 37.5 46 31.5 46 24c0-1.3-.2-2.7-.5-4z"
        fill="#1976D2"
      />
    </Svg>
  );
}

function ShieldIcon({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l7 4v5c0 5.25-3.5 10-7 11.5C8.5 21 5 16.25 5 11V6l7-4z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SignInScreen({ onSkip }: SignInScreenProps) {
  const { colors } = useAppTheme();
  const { signIn, isAuthLoading, syncError } = useCloudSync();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      // Error is handled via syncError in context
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ShieldIcon color={colors.accent} />

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Protect your accounts
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Sign in with Google to securely back up your authenticator codes to Google Drive. Your data is encrypted and only you can access it.
        </Text>

        {syncError ? (
          <Text style={[styles.errorText, { color: colors.warning }]}>{syncError}</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSignIn}
          disabled={isAuthLoading}
          style={({ pressed }) => [
            styles.googleButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              opacity: pressed ? 0.8 : isAuthLoading ? 0.6 : 1,
            },
          ]}
        >
          {isAuthLoading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <GoogleLogo />
              <Text style={[styles.googleButtonText, { color: colors.textPrimary }]}>
                Sign in with Google
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={onSkip}
          disabled={isAuthLoading}
          style={({ pressed }) => [
            styles.skipButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
