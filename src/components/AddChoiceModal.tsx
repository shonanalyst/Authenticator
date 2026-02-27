import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface AddChoiceModalProps {
  visible: boolean;
  onScanQR: () => void;
  onManual: () => void;
  onClose: () => void;
  colors: ColorScheme;
}

export function AddChoiceModal({ visible, onScanQR, onManual, onClose, colors }: AddChoiceModalProps) {
  // Start offscreen — always mounted, never removed
  const slideAnim = useRef(new Animated.Value(400)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
          restDisplacementThreshold: 0.5,
          restSpeedThreshold: 0.5,
        }),
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, bgAnim]);

  const bgOpacity = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  return (
    // Always rendered — pointerEvents controls interaction
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.surfaceBorder }]} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Add Account</Text>

        <Pressable
          onPress={onScanQR}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.accentDim }]}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Path
                d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM11 11h2v2h-2zM15 14h2v2h-2z"
                fill={colors.accent}
              />
            </Svg>
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Scan QR Code</Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>Use camera to scan a QR code</Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        <Pressable
          onPress={onManual}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: colors.background, opacity: pressed ? 0.7 : 1, marginTop: spacing.sm },
          ]}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.accentDim }]}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke={colors.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Enter Manually</Text>
            <Text style={[styles.optionSub, { color: colors.textSecondary }]}>Type in the secret key</Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
