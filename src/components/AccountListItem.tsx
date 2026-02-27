import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Vibration } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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

const RING_SIZE = 36;
const RING_STROKE = 2.5;
const WARNING_THRESHOLD = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_THRESHOLD = -(SCREEN_WIDTH * 0.65);

interface AccountListItemProps {
  account: Account;
  colors: ColorScheme;
}

function formatCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}

export function AccountListItem({ account, colors }: AccountListItemProps) {
  const { unixTime, secondsRemaining, progress } = useTimer();
  const { removeAccount, umk } = useAccounts();
  const code = useDecryptedTotp(account, umk, unixTime);

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
            {/* Left: initial badge + issuer/account */}
            <View style={styles.leftSection}>
              <View style={styles.initialBadge}>
                <Text style={styles.initialText}>{initial}</Text>
              </View>
              <View style={styles.labelGroup}>
                <Text style={styles.issuer} numberOfLines={1}>
                  {account.issuer}
                </Text>
                {account.account ? (
                  <Text style={styles.account} numberOfLines={1}>
                    {account.account}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Right: OTP code + ring */}
            <View style={styles.rightSection}>
              <Animated.Text style={[styles.code, animatedCodeStyle]}>
                {formatCode(code)}
              </Animated.Text>
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
    borderRadius: 20,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: spacing.md,
  },
  initialBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontSize: 20,
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
  account: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  code: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: typography.codeDisplay.fontFamily,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1.5,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seconds: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
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
