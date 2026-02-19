import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinPad } from '../components/PinPad';
import { useSecurity } from '../contexts/SecurityContext';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;

export function UnlockScreen() {
  const { colors } = useAppTheme();
  const {
    unlock,
    unlockWithBiometric,
    isBiometricEnabled,
    failedAttempts,
    lockUntil,
  } = useSecurity();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const isLockedOut = lockUntil !== null && Date.now() < lockUntil;

  // Lockout countdown timer
  useEffect(() => {
    if (!lockUntil) {
      setCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setError('');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  // Auto-prompt biometric on mount and when returning from background.
  // Uses a ref to track if a biometric prompt is already in progress
  // to prevent duplicate prompts.
  const biometricInProgress = useRef(false);

  const tryBiometric = useCallback(async () => {
    if (!isBiometricEnabled || biometricInProgress.current) return;
    // Only prompt when the app is fully in the foreground
    if (AppState.currentState !== 'active') return;
    biometricInProgress.current = true;
    try {
      await unlockWithBiometric();
    } finally {
      biometricInProgress.current = false;
    }
  }, [isBiometricEnabled, unlockWithBiometric]);

  // On mount: wait a short tick so the screen is visible before prompting
  useEffect(() => {
    const timer = setTimeout(tryBiometric, 300);
    return () => clearTimeout(timer);
  }, [tryBiometric]);

  // When returning from background: prompt again
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // Small delay to let the OS fully foreground the app
        setTimeout(tryBiometric, 300);
      }
    });
    return () => subscription.remove();
  }, [tryBiometric]);

  const handleSubmit = useCallback(async () => {
    const success = await unlock(pin);
    if (!success) {
      setError('Wrong PIN');
      setPin('');
    }
  }, [pin, unlock]);

  const handleBiometric = useCallback(async () => {
    if (biometricInProgress.current) return;
    biometricInProgress.current = true;
    try {
      await unlockWithBiometric();
    } finally {
      biometricInProgress.current = false;
    }
  }, [unlockWithBiometric]);

  const attemptsRemaining = MAX_ATTEMPTS - failedAttempts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: colors.accent }]}>🔒</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Authenticator</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your PIN to unlock
        </Text>
      </View>

      <View style={styles.content}>
        {error && countdown <= 0 ? (
          <Text style={[styles.error, { color: colors.warning }]}>{error}</Text>
        ) : null}

        {countdown > 0 ? (
          <Text style={[styles.error, { color: colors.warning }]}>
            Too many attempts. Try again in {countdown}s
          </Text>
        ) : null}

        {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && countdown <= 0 ? (
          <Text style={[styles.attempts, { color: colors.textSecondary }]}>
            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
          </Text>
        ) : null}

        <PinPad
          pin={pin}
          onPinChange={setPin}
          onSubmit={handleSubmit}
          targetLength={PIN_LENGTH}
          colors={colors}
          disabled={isLockedOut}
        />

        {isBiometricEnabled ? (
          <Pressable
            onPress={handleBiometric}
            style={({ pressed }) => [
              styles.biometricButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.biometricText, { color: colors.accent }]}>
              Use Biometrics
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  attempts: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  biometricButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
