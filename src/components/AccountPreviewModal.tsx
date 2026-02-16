import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
import { OtpAuthParams } from '../types/account';
import { AuthenticatorCard } from './AuthenticatorCard';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface AccountPreviewModalProps {
  visible: boolean;
  params: OtpAuthParams | null;
  onConfirm: (params: OtpAuthParams) => void;
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
  const [editedIssuer, setEditedIssuer] = useState('');
  const [editedAccount, setEditedAccount] = useState('');

  useEffect(() => {
    if (params) {
      setEditedIssuer(params.issuer);
      setEditedAccount(params.account);
    }
  }, [params]);

  if (!params) return null;

  const handleConfirm = () => {
    onConfirm({
      ...params,
      issuer: editedIssuer.trim() || params.issuer,
      account: editedAccount.trim(),
    });
  };

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
            issuer={editedIssuer || params.issuer}
            account={editedAccount}
            colors={colors}
          />

          <View style={styles.fields}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              value={editedIssuer}
              onChangeText={setEditedIssuer}
              placeholder="Service name"
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: spacing.sm }]}>Account</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              value={editedAccount}
              onChangeText={setEditedAccount}
              placeholder="email@example.com"
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

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
              onPress={handleConfirm}
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
  fields: {
    marginTop: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
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
