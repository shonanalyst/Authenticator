import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../hooks/useAppTheme';
import { usePremium } from '../contexts/PremiumContext';
import { spacing } from '../theme/spacing';
import { FREE_ACCOUNT_LIMIT } from '../constants/premium';

interface PremiumPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

const FEATURES = [
  'Unlimited 2FA accounts',
  'Secure encrypted backup',
  'Priority support',
  'All future features included',
];

export function PremiumPaywallModal({ visible, onClose }: PremiumPaywallModalProps) {
  const { colors, isDark } = useAppTheme();
  const { purchasePremium, restorePurchases, isPurchasing, products } = usePremium();

  const product = products[0];
  const priceText = product?.displayPrice ?? '...';

  const handlePurchase = async () => {
    await purchasePremium();
    onClose();
  };

  const handleRestore = async () => {
    await restorePurchases();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={isDark ? ['#0D0D0F', '#1A1A1E'] : ['#EFF6FF', '#F9FAFB']}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: '#2563EB' }]}>
              <StarIcon color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Upgrade to Premium
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              You've reached the {FREE_ACCOUNT_LIMIT} free account limit
            </Text>
          </View>

          {/* Features */}
          <View style={[styles.featuresCard, { backgroundColor: colors.surface }]}>
            {FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.checkCircle}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12l5 5L20 7"
                      stroke="#2563EB"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handlePurchase}
              disabled={isPurchasing}
              style={({ pressed }) => [
                styles.purchaseButton,
                { opacity: pressed || isPurchasing ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                style={styles.purchaseGradient}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.purchaseText}>
                    Unlock Premium · {priceText}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleRestore}
              disabled={isPurchasing}
              style={({ pressed }) => [
                styles.restoreButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
                Restore Purchases
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={isPurchasing}
              style={({ pressed }) => [
                styles.cancelButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                Not now
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresCard: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  purchaseGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontSize: 15,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: 14,
  },
});
