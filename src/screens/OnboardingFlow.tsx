import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Page {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const pages: Page[] = [
  {
    id: '1',
    icon: '🔐',
    title: 'Secure your accounts',
    description:
      'Add an extra layer of security with time-based one-time passwords (TOTP). Works with Google, GitHub, and thousands more.',
  },
  {
    id: '2',
    icon: '📷',
    title: 'Scan your QR code',
    description:
      'Simply scan the QR code from your service provider to add a new account. Quick setup in seconds.',
  },
  {
    id: '3',
    icon: '⏱️',
    title: 'Your code refreshes every 30 seconds',
    description:
      'Each verification code is valid for 30 seconds, then automatically refreshes to keep your accounts safe.',
  },
  {
    id: '4',
    icon: '☁️',
    title: 'Secure cloud backup',
    description:
      'Your secrets are encrypted with AES-256-GCM before storage. Only you can access your authentication codes.',
  },
];

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
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
    </View>
  ), [colors]);

  const isLastPage = currentIndex === pages.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
                {
                  backgroundColor: i === currentIndex ? colors.accent : colors.surfaceBorder,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>
            {isLastPage ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
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
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
