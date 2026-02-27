import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions, ViewToken } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Page {
  id: string;
  iconType: string;
  title: string;
  description: string;
}

const pages: Page[] = [
  {
    id: '1',
    iconType: 'shield',
    title: 'Secure your accounts',
    description:
      'Add an extra layer of security with time-based one-time passwords (TOTP). Works with Google, GitHub, and thousands more.',
  },
  {
    id: '2',
    iconType: 'camera',
    title: 'Scan your QR code',
    description:
      'Simply scan the QR code from your service provider to add a new account. Quick setup in seconds.',
  },
  {
    id: '3',
    iconType: 'clock',
    title: 'Codes refresh every 30s',
    description:
      'Each verification code is valid for 30 seconds, then automatically refreshes to keep your accounts safe.',
  },
  {
    id: '4',
    iconType: 'cloud',
    title: 'Secure cloud backup',
    description:
      'Your secrets are encrypted with AES-256-GCM before storage. Only you can access your authentication codes.',
  },
];

function PageIcon({ type }: { type: string }) {
  const size = 52;
  const color = '#2563EB';
  if (type === 'shield') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l7 4v5c0 5.25-3.5 10-7 11.5C8.5 21 5 16.25 5 11V6l7-4z" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
  if (type === 'camera') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
  if (type === 'clock') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke={color} strokeWidth={1.5} />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
  // cloud
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { colors } = useAppTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  }, [currentIndex, onComplete]);

  const renderPage = useCallback(({ item }: { item: Page }) => (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <View style={styles.iconContainer}>
        <PageIcon type={item.iconType} />
      </View>
      <Text style={[styles.title, { color: '#111827' }]}>{item.title}</Text>
      <Text style={[styles.description, { color: '#4B5563' }]}>{item.description}</Text>
    </View>
  ), []);

  const isLastPage = currentIndex === pages.length - 1;

  return (
    <LinearGradient colors={['#EFF6FF', '#E0E7FF']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderPage}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
        />

        <View style={styles.footer}>
          <View style={styles.indicators}>
            {pages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex
                    ? { width: 32, backgroundColor: '#2563EB' }
                    : { width: 8, backgroundColor: '#CBD5E1' },
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.button,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.buttonText}>
              {isLastPage ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
