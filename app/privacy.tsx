import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { spacing } from '../src/theme/spacing';

function BulletItem({ text, color, accentColor }: { text: string; color: string; accentColor: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
      <Text style={[styles.bulletText, { color }]}>{text}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors } = useAppTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
            stroke={colors.accent}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy & Security</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Your data protection at a glance
        </Text>
      </View>

      {/* Privacy Policy */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY POLICY</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <BulletItem
          text="No analytics or tracking — zero telemetry collected"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="No server — all data is stored locally on your device"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="Cloud backup is optional and encrypted end-to-end before leaving your device"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="No personal data collected beyond the accounts you add"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="Open source — full source code available for audit"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
      </View>

      {/* Security Architecture */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY ARCHITECTURE</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <BulletItem
          text="AES-256-GCM encryption for all TOTP secrets at rest"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="User Master Key stored only in hardware-backed Keychain / Keystore"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="Master Key cleared from memory when the app is locked"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="Each account encrypted with a unique random initialization vector"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="Cloud backups double-encrypted with an HKDF-derived key — Google only sees an opaque blob"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="PIN protected with SHA-256 hashing and a random salt"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
        <BulletItem
          text="Brute-force protection: 5 failed attempts trigger a 30-second lockout"
          color={colors.textPrimary}
          accentColor={colors.accent}
        />
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
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
    paddingVertical: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  footer: {
    height: spacing.xxl,
  },
});
