import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Constants from 'expo-constants';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCloudSync } from '../contexts/CloudSyncContext';
import { spacing } from '../theme/spacing';

const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

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

function ShieldIcon({ color, size = 56 }: { color: string; size?: number }) {
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

export function SignInScreen() {
  const { colors } = useAppTheme();
  const { signIn, skipSignIn, isAuthLoading, syncError } = useCloudSync();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch {
      // Error is handled via syncError in context
    }
  };

  return (
    <LinearGradient
      colors={['#EFF6FF', '#E0E7FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ShieldIcon color="#2563EB" size={56} />
          </View>

          <Text style={styles.title}>Welcome to Authenticator</Text>

          <Text style={styles.description}>
            Sign in with Google to securely back up your 2FA codes. Your data is encrypted end-to-end.
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
              { opacity: pressed ? 0.85 : isAuthLoading ? 0.6 : 1 },
            ]}
          >
            {isAuthLoading ? (
              <ActivityIndicator size="small" color="#1C1C1E" />
            ) : (
              <>
                <GoogleLogo size={22} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {IS_EXPO_GO ? (
            <Pressable
              onPress={skipSignIn}
              style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.skipText}>Skip for testing (Expo Go only)</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#4B5563',
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
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  skipButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
