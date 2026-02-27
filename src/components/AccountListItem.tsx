import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Vibration, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Circle, Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Account } from '../types/account';
import { useDecryptedTotp } from '../hooks/useDecryptedTotp';
import { useTimer } from '../contexts/TimerContext';
import { useAccounts } from '../contexts/AccountsContext';
import { ColorScheme } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getServiceColor } from '../constants/serviceColors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 32;
const RING_STROKE = 2.5;
const WARNING_THRESHOLD = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = -(SCREEN_WIDTH * 0.65);

interface AccountListItemProps {
  account: Account;
  colors: ColorScheme;
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CopyIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.912 4.895 3 6 3h8c1.105 0 2 .912 2 2.036v1.866"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M18 8H10c-1.105 0-2 .895-2 2v10c0 1.105.895 2 2 2h8c1.105 0 2-.895 2-2V10c0-1.105-.895-2-2-2z"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function AccountListItem({ account, colors }: AccountListItemProps) {
  const { unixTime, secondsRemaining, progress } = useTimer();
  const { removeAccount, umk } = useAccounts();
  const code = useDecryptedTotp(account, umk, unixTime);
  const [copied, setCopied] = useState(false);

  const cardColor = getServiceColor(account.issuer, colors.accent);

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = RING_SIZE / 2;

  const animatedProgress = useSharedValue(progress);
  const codeOpacity = useSharedValue(1);

  useEffect(() => {
    if (progress < 0.05) {
      animatedProgress.value = 0;
      animatedProgress.value = withTiming(progress, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedProgress.value = withTiming(progress, {
        duration: 1000,
        easing: Easing.linear,
      });
    }
  }, [progress, animatedProgress]);

  useEffect(() => {
    if (code === '------') return;
    codeOpacity.value = withSequence(
      withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 300, easing: Easing.in(Easing.cubic) }),
    );
  }, [code, codeOpacity]);

  const animatedStrokeProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const animatedCodeStyle = useAnimatedStyle(() => ({
    opacity: codeOpacity.value,
  }));

  const isWarning = secondsRemaining <= WARNING_THRESHOLD;
  const ringActiveColor = isWarning ? '#FCA5A5' : 'rgba(255,255,255,0.9)';
  const ringTrackColor = 'rgba(255,255,255,0.3)';

  const handleCopy = useCallback(async () => {
    const rawCode = code.replace(/\s/g, '');
    await Clipboard.setStringAsync(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Swipe-to-delete
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue<number | undefined>(undefined);

  const doRemove = useCallback(() => {
    Vibration.vibrate(50);
    removeAccount(account.id);
  }, [account.id, removeAccount]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      } else {
        translateX.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-500, { duration: 200, easing: Easing.in(Easing.cubic) });
        if (itemHeight.value !== undefined) {
          itemHeight.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, () => {
            runOnJS(doRemove)();
          });
        } else {
          runOnJS(doRemove)();
        }
      } else {
        translateX.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  const deleteTextAnimStyle = useAnimatedStyle(() => {
    const absX = Math.abs(translateX.value);
    return { opacity: absX > 40 ? 1 : absX / 40 };
  });

  const wrapperStyle = useAnimatedStyle(() => {
    if (itemHeight.value !== undefined) {
      return { height: itemHeight.value, overflow: 'hidden' as const };
    }
    return {};
  });

  const initial = account.issuer ? account.issuer.charAt(0).toUpperCase() : '?';
  const [firstHalf, secondHalf] = code.length === 6
    ? [code.slice(0, 3), code.slice(3)]
    : [code, ''];

  return (
    <Animated.View
      style={wrapperStyle}
      onLayout={(e) => {
        if (itemHeight.value === undefined) {
          itemHeight.value = e.nativeEvent.layout.height;
        }
      }}
    >
      <View style={styles.swipeWrapper}>
        {/* Red background that shows when swiping */}
        <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
          <Animated.Text style={[styles.deleteText, deleteTextAnimStyle]}>Delete</Animated.Text>
        </Animated.View>

        {/* Card that slides */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.container,
              { backgroundColor: cardColor },
              cardStyle,
            ]}
          >
            {/* Top row: initial badge + issuer/account + copy button */}
            <View style={styles.topRow}>
              <View style={styles.topLeft}>
                <View style={styles.initialBadge}>
                  <Text style={styles.initialText}>{initial}</Text>
                </View>
                <View style={styles.labelGroup}>
                  <Text style={styles.issuer} numberOfLines={1}>
                    {account.issuer}
                  </Text>
                  {account.account ? (
                    <Text style={styles.accountLabel} numberOfLines={1}>
                      {account.account}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                onPress={handleCopy}
                style={styles.copyButton}
                hitSlop={8}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Pressable>
            </View>

            {/* Center: large OTP code */}
            <Animated.Text style={[styles.code, animatedCodeStyle]}>
              {firstHalf}
              {secondHalf ? (
                <Text style={styles.codeSecondHalf}> {secondHalf}</Text>
              ) : null}
            </Animated.Text>

            {/* Bottom: countdown ring */}
            <View style={styles.bottomRow}>
              <View style={styles.ringContainer}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={ringTrackColor}
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={ringActiveColor}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedStrokeProps}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                  />
                </Svg>
                <Text style={[styles.seconds, isWarning && styles.secondsWarning]}>
                  {secondsRemaining}
                </Text>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeWrapper: {
    position: 'relative',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF3B30',
    borderRadius: 24,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  container: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  initialBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  labelGroup: {
    flex: 1,
  },
  issuer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    fontFamily: typography.codeDisplay.fontFamily,
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeSecondHalf: {
    color: 'rgba(255,255,255,0.6)',
  },
  bottomRow: {
    alignItems: 'flex-end',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seconds: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    position: 'absolute',
  },
  secondsWarning: {
    color: '#FCA5A5',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
