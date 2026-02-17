import React, { useState, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, Alert, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useThemeMode } from '../src/contexts/ThemeContext';
import { useSecurity } from '../src/contexts/SecurityContext';
import { useCloudSync } from '../src/contexts/CloudSyncContext';
import { useAccounts } from '../src/contexts/AccountsContext';
import { PinSetupModal } from '../src/components/PinSetupModal';
import { spacing } from '../src/theme/spacing';

export default function SettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const {
    isLockEnabled,
    isLocked,
    isBiometricEnabled,
    isBiometricAvailable,
    enableLock,
    disableLock,
    enableBiometric,
    disableBiometric,
  } = useSecurity();
  const { replaceAccounts } = useAccounts();
  const {
    isSignedIn,
    userEmail,
    isAuthLoading,
    isSyncing,
    syncError,
    isDeviceRooted,
    signIn,
    signOut,
    backup,
    restore,
    checkBackup,
  } = useCloudSync();

  const router = useRouter();
  const [showPinSetup, setShowPinSetup] = useState(false);

  const syncDisabled = isLocked || isSyncing || isAuthLoading || isDeviceRooted;

  // ── Security Handlers ──

  const handleLockToggle = useCallback((value: boolean) => {
    if (value) {
      setShowPinSetup(true);
    } else {
      Alert.alert(
        'Disable App Lock',
        'Are you sure you want to disable the app lock? Your PIN will be removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => disableLock(),
          },
        ],
      );
    }
  }, [disableLock]);

  const handlePinCreated = useCallback(async (pin: string) => {
    await enableLock(pin);
    setShowPinSetup(false);
  }, [enableLock]);

  const handleBiometricToggle = useCallback((value: boolean) => {
    if (value) {
      enableBiometric();
    } else {
      disableBiometric();
    }
  }, [enableBiometric, disableBiometric]);

  // ── Cloud Sync Handlers ──

  const handleSignIn = useCallback(async () => {
    try {
      await signIn();
    } catch {
      Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
    }
  }, [signIn]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'You will need to sign in again to backup or restore your accounts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  }, [signOut]);

  const handleBackup = useCallback(async () => {
    const result = await backup();
    if (result.success) {
      Alert.alert('Backup Complete', 'Your accounts have been securely backed up to Google Drive.');
    } else {
      Alert.alert('Backup Failed', result.error || 'An unknown error occurred.');
    }
  }, [backup]);

  const handleRestore = useCallback(async () => {
    try {
      const info = await checkBackup();
      if (!info.exists) {
        Alert.alert('No Backup Found', 'There is no backup in your Google Drive.');
        return;
      }

      const dateStr = info.timestamp
        ? new Date(info.timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'unknown date';

      Alert.alert(
        'Restore Backup',
        `Restore from backup made on ${dateStr}?\n\nThis will replace all current accounts.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await restore();
                await replaceAccounts(result.accounts);
                Alert.alert(
                  'Restore Complete',
                  `Successfully restored ${result.accounts.length} account${result.accounts.length === 1 ? '' : 's'}.`,
                );
              } catch (e) {
                Alert.alert(
                  'Restore Failed',
                  e instanceof Error ? e.message : 'An unknown error occurred.',
                );
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to check backup status.');
    }
  }, [checkBackup, restore, replaceAccounts]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── SECURITY ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Enable App Lock</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              Require PIN to open the app
            </Text>
          </View>
          <Switch
            value={isLockEnabled}
            onValueChange={handleLockToggle}
            trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
          />
        </View>

        {isLockEnabled && isBiometricAvailable ? (
          <>
            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Biometric Unlock</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Use Face ID or fingerprint
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
              />
            </View>
          </>
        ) : null}
      </View>

      {/* ── ROOT WARNING ── */}
      {isDeviceRooted ? (
        <View style={[styles.warningBanner, { backgroundColor: colors.warningDim, borderColor: colors.warning }]}>
          <Text style={[styles.warningTitle, { color: colors.warning }]}>
            Rooted Device Detected
          </Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Cloud sync is disabled for security. Local accounts remain encrypted and safe.
          </Text>
        </View>
      ) : null}

      {/* ── CLOUD SYNC ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CLOUD SYNC</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {!isSignedIn ? (
          <Pressable
            onPress={handleSignIn}
            disabled={isAuthLoading}
            style={[styles.row, isAuthLoading && styles.disabledRow]}
          >
            {isAuthLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.rowTitle, { color: colors.accent }]}>Sign in with Google</Text>
            )}
          </Pressable>
        ) : (
          <>
            {/* Connected account */}
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Google Account</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {userEmail}
                </Text>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

            {/* Back Up Now */}
            <Pressable
              onPress={handleBackup}
              disabled={syncDisabled}
              style={[styles.row, syncDisabled && styles.disabledRow]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: syncDisabled ? colors.textSecondary : colors.accent }]}>
                    Back Up Now
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    Encrypt and upload to Google Drive
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

            {/* Restore from Backup */}
            <Pressable
              onPress={handleRestore}
              disabled={syncDisabled}
              style={[styles.row, syncDisabled && styles.disabledRow]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: syncDisabled ? colors.textSecondary : colors.accent }]}>
                  Restore from Backup
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Download and decrypt from Google Drive
                </Text>
              </View>
            </Pressable>

            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

            {/* Sign Out */}
            <Pressable
              onPress={handleSignOut}
              disabled={isSyncing}
              style={[styles.row, isSyncing && styles.disabledRow]}
            >
              <Text style={[styles.rowTitle, { color: colors.warning }]}>Sign Out</Text>
            </Pressable>
          </>
        )}

        {syncError ? (
          <>
            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.row}>
              <Text style={[styles.rowSubtitle, { color: colors.warning }]}>{syncError}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* ── APPEARANCE ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Dark Mode</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              {themeMode === 'system' ? 'Following system setting' : themeMode === 'dark' ? 'Always dark' : 'Always light'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
            trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
          />
        </View>
        {themeMode !== 'system' ? (
          <>
            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
            <Pressable
              onPress={() => setThemeMode('system')}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: colors.accent }]}>Use System Setting</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {/* ── ABOUT ── */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Pressable
          onPress={() => router.push('/privacy')}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Privacy & Security</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
              How your data is protected
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.bottomSpacer} />

      <PinSetupModal
        visible={showPinSetup}
        onComplete={handlePinCreated}
        onCancel={() => setShowPinSetup(false)}
        colors={colors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  section: {
    marginHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md,
  },
  disabledRow: {
    opacity: 0.4,
  },
  warningBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
