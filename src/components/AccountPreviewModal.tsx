import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { OtpAuthParams } from '../types/account';
import { AuthenticatorCard } from './AuthenticatorCard';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface AccountPreviewModalProps {
  visible: boolean;
  params: OtpAuthParams | null;
  onConfirm: () => void;
  onCancel: () => void;
  colors: ColorScheme;
}

export function AccountPreviewModal({
  visible,
  params,
  onConfirm,
  onCancel,
  colors,
}: AccountPreviewModalProps) {
  if (!params) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Add Account
          </Text>

          <AuthenticatorCard
            secret={params.secret}
            issuer={params.issuer}
            account={params.account}
            colors={colors}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
