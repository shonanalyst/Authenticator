import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { generateTOTP } from '../utils/totp';
import { OtpAuthParams } from '../types/account';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ManualEntryModalProps {
  visible: boolean;
  onSubmit: (params: OtpAuthParams) => void;
  onClose: () => void;
  colors: ColorScheme;
}

export function ManualEntryModal({ visible, onSubmit, onClose, colors }: ManualEntryModalProps) {
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  // Reset fields when modal opens
  useEffect(() => {
    if (visible) {
      setIssuer('');
      setAccount('');
      setSecret('');
      setError('');
    }
  }, [visible]);

  const handleSubmit = () => {
    const trimmedSecret = secret.trim().replace(/\s/g, '').toUpperCase();
    const trimmedIssuer = issuer.trim() || 'Unknown';
    const trimmedAccount = account.trim();

    if (!trimmedSecret) {
      setError('Secret key is required');
      return;
    }

    // Validate secret by attempting TOTP generation
    const testCode = generateTOTP(trimmedSecret, Math.floor(Date.now() / 1000), 30, 6);
    if (testCode === '------') {
      setError('Invalid secret key. Please check and try again.');
      return;
    }

    setError('');
    onSubmit({
      secret: trimmedSecret,
      issuer: trimmedIssuer,
      account: trimmedAccount,
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    });
  };

  const inputStyle = [styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.surfaceBorder }];
  const labelStyle = [styles.label, { color: colors.textSecondary }];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.surface }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.headerCancel, { color: colors.accent }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Enter Manually</Text>
          <Pressable onPress={handleSubmit} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.headerDone, { color: colors.accent }]}>Add</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT DETAILS</Text>
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            <View style={styles.fieldRow}>
              <Text style={labelStyle}>Service</Text>
              <TextInput
                style={inputStyle}
                value={issuer}
                onChangeText={setIssuer}
                placeholder="e.g. Google, GitHub"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.fieldRow}>
              <Text style={labelStyle}>Account</Text>
              <TextInput
                style={inputStyle}
                value={account}
                onChangeText={setAccount}
                placeholder="e.g. user@email.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.lg }]}>SECRET KEY</Text>
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            <TextInput
              style={[inputStyle, styles.secretInput]}
              value={secret}
              onChangeText={(t) => { setSecret(t); setError(''); }}
              placeholder="Enter the secret key"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.warning }]}>{error}</Text>
          ) : null}

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            The secret key is usually shown as a string of letters and numbers when you set up two-factor authentication.
          </Text>

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.addButtonText}>Add Account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCancel: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fieldRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    paddingVertical: 0,
    borderWidth: 0,
  },
  secretInput: {
    padding: spacing.md,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
  error: {
    fontSize: 14,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
