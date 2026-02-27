import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Text,
  Animated,
} from 'react-native';
import { useNavigation } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AccountListItem } from '../src/components/AccountListItem';
import { EmptyState } from '../src/components/EmptyState';
import { QrScannerModal } from '../src/components/QrScannerModal';
import { AccountPreviewModal } from '../src/components/AccountPreviewModal';
import { PremiumPaywallModal } from '../src/components/PremiumPaywallModal';
import { Fab } from '../src/components/Fab';
import { AddChoiceModal } from '../src/components/AddChoiceModal';
import { ManualEntryModal } from '../src/components/ManualEntryModal';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useAccounts } from '../src/contexts/AccountsContext';
import { usePremium } from '../src/contexts/PremiumContext';
import { useTimer } from '../src/contexts/TimerContext';
import { OtpAuthParams, Account } from '../src/types/account';
import { spacing } from '../src/theme/spacing';

type ModalState = 'idle' | 'addChoice' | 'scanning' | 'manual' | 'preview' | 'paywall';

export default function AccountsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { accounts, addAccount, isLoading } = useAccounts();
  const { isPremium, FREE_ACCOUNT_LIMIT } = usePremium();
  const { progress, secondsRemaining } = useTimer();
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [scannedParams, setScannedParams] = useState<OtpAuthParams | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Animated timer bar — smooth continuous animation
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const lastProgressRef = useRef(progress);

  useEffect(() => {
    const newProgress = progress;
    const prev = lastProgressRef.current;
    lastProgressRef.current = newProgress;

    // When timer resets (progress goes from ~1 back to ~0), snap immediately
    if (newProgress < prev - 0.5) {
      animatedProgress.setValue(newProgress);
    } else {
      Animated.timing(animatedProgress, {
        toValue: newProgress,
        duration: 950,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, animatedProgress]);

  const filteredAccounts = searchQuery.trim()
    ? accounts.filter(
        (a) =>
          a.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.account?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;

  const handleAddPress = useCallback(() => {
    if (modalState === 'addChoice') {
      setModalState('idle');
    } else if (!isPremium && accounts.length >= FREE_ACCOUNT_LIMIT) {
      setModalState('paywall');
    } else {
      setModalState('addChoice');
    }
  }, [modalState, isPremium, accounts.length, FREE_ACCOUNT_LIMIT]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>
          Authenticator
        </Text>
      ),
      headerRight: undefined,
    });
  }, [navigation, colors]);

  const handleScanned = useCallback((params: OtpAuthParams) => {
    setScannedParams(params);
    setModalState('preview');
  }, []);

  const handleScannerClose = useCallback(() => {
    setModalState('idle');
  }, []);

  const handleManualEntry = useCallback((params: OtpAuthParams) => {
    setScannedParams(params);
    setModalState('preview');
  }, []);

  const handleConfirm = useCallback(async (params: OtpAuthParams) => {
    await addAccount(params);
    setScannedParams(null);
    setModalState('idle');
  }, [addAccount]);

  const handleCancel = useCallback(() => {
    setScannedParams(null);
    setModalState('idle');
  }, []);

  const renderItem = useCallback(({ item }: { item: Account }) => (
    <AccountListItem account={item} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback((item: Account) => item.id, []);

  const timerWidthPercent = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
          <Path
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            stroke={colors.textSecondary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search accounts..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Timer bar — only when there are accounts */}
      {accounts.length > 0 && <View style={[styles.timerSection, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <View style={styles.timerRow}>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>Refreshing in</Text>
          <Text style={[styles.timerCount, { color: colors.textPrimary }]}>{secondsRemaining}s</Text>
        </View>
        <View style={[styles.timerTrack, { backgroundColor: colors.surfaceBorder }]}>
          <Animated.View style={[styles.timerBar, { width: timerWidthPercent, backgroundColor: colors.accent }]} />
        </View>
      </View>}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredAccounts.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <FlatList
          data={filteredAccounts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            !isPremium ? (
              <Text style={[styles.accountCount, { color: colors.textSecondary }]}>
                {accounts.length} / {FREE_ACCOUNT_LIMIT} accounts used
              </Text>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <Fab onPress={handleAddPress} colors={colors} isOpen={modalState === 'addChoice'} />

      <AddChoiceModal
        visible={modalState === 'addChoice'}
        onScanQR={() => setModalState('scanning')}
        onManual={() => setModalState('manual')}
        onClose={() => setModalState('idle')}
        colors={colors}
      />

      <QrScannerModal
        visible={modalState === 'scanning'}
        onScanned={handleScanned}
        onClose={handleScannerClose}
        colors={colors}
      />

      <ManualEntryModal
        visible={modalState === 'manual'}
        onSubmit={handleManualEntry}
        onClose={() => setModalState('idle')}
        colors={colors}
      />

      <AccountPreviewModal
        visible={modalState === 'preview'}
        params={scannedParams}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        colors={colors}
      />

      <PremiumPaywallModal
        visible={modalState === 'paywall'}
        onClose={() => setModalState('idle')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  timerSection: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 13,
  },
  timerCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  timerTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 4,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  accountCount: {
    textAlign: 'center',
    fontSize: 13,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
