import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { PinPad } from './PinPad';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PinSetupModalProps {
  visible: boolean;
  onComplete: (pin: string) => void;
  onCancel: () => void;
  colors: ColorScheme;
}

const PIN_LENGTH = 4;

export function PinSetupModal({ visible, onComplete, onCancel, colors }: PinSetupModalProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStep('create');
    setPin('');
    setFirstPin('');
    setError('');
  }, []);

  const handleCancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const handleSubmit = useCallback(() => {
    if (step === 'create') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
      setError('');
    } else {
      if (pin === firstPin) {
        onComplete(pin);
        reset();
      } else {
        setError('PINs do not match. Try again.');
        setPin('');
        setFirstPin('');
        setStep('create');
      }
    }
  }, [step, pin, firstPin, onComplete, reset]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
      onShow={reset}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {step === 'create' ? 'Create a PIN' : 'Confirm your PIN'}
          </Text>

          {error ? (
            <Text style={[styles.error, { color: colors.warning }]}>{error}</Text>
          ) : (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'create'
                ? 'Enter a 4-digit PIN to secure your app'
                : 'Re-enter your PIN to confirm'}
            </Text>
          )}

          <PinPad
            pin={pin}
            onPinChange={setPin}
            onSubmit={handleSubmit}
            targetLength={PIN_LENGTH}
            colors={colors}
          />

          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  cancelButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: 16,
  },
});
