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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 40;
const RING_STROKE = 3;
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
  const trackColor = isWarning ? colors.warningDim : colors.accentDim;
  const activeColor = isWarning ? colors.warning : colors.accent;

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
      // Only allow swiping left
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      } else {
        translateX.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        // Swipe past threshold -> animate off and delete
        translateX.value = withTiming(-500, { duration: 200, easing: Easing.in(Easing.cubic) });
        if (itemHeight.value !== undefined) {
          itemHeight.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, () => {
            runOnJS(doRemove)();
          });
        } else {
          runOnJS(doRemove)();
        }
      } else {
        // Snap back
        translateX.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => {
    const show = translateX.value < 0;
    return {
      opacity: show ? 1 : 0,
    };
  });

  const deleteTextAnimStyle = useAnimatedStyle(() => {
    const absX = Math.abs(translateX.value);
    return {
      opacity: absX > 40 ? 1 : absX / 40,
    };
  });

  const wrapperStyle = useAnimatedStyle(() => {
    if (itemHeight.value !== undefined) {
      return { height: itemHeight.value, overflow: 'hidden' as const };
    }
    return {};
  });

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
          <Animated.View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, cardStyle]}>
            <View style={styles.info}>
              <Text style={[styles.issuer, { color: colors.textPrimary }]} numberOfLines={1}>
                {account.issuer}
              </Text>
              {account.account ? (
                <Text style={[styles.account, { color: colors.textSecondary }]} numberOfLines={1}>
                  {account.account}
                </Text>
              ) : null}
              <Animated.Text style={[styles.code, { color: colors.textPrimary }, animatedCodeStyle]}>
                {formatCode(code)}
              </Animated.Text>
            </View>

            <View style={styles.ringContainer}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={trackColor}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <AnimatedCircle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={activeColor}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeDasharray={circumference}
                  animatedProps={animatedStrokeProps}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              </Svg>
              <Text style={[styles.seconds, { color: isWarning ? colors.warning : colors.textSecondary }]}>
                {secondsRemaining}
              </Text>
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
    borderRadius: 16,
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
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  issuer: {
    fontSize: 16,
    fontWeight: '600',
  },
  account: {
    fontSize: 12,
    marginTop: 2,
  },
  code: {
    fontSize: 28,
    fontWeight: '300',
    fontFamily: typography.codeDisplay.fontFamily,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seconds: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
    textAlign: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
