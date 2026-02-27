import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Text,
} from 'react-native';
import { useNavigation } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { AccountListItem } from '../src/components/AccountListItem';
import { EmptyState } from '../src/components/EmptyState';
import { QrScannerModal } from '../src/components/QrScannerModal';
import { AccountPreviewModal } from '../src/components/AccountPreviewModal';
import { PremiumPaywallModal } from '../src/components/PremiumPaywallModal';
import { Fab } from '../src/components/Fab';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useAccounts } from '../src/contexts/AccountsContext';
import { usePremium } from '../src/contexts/PremiumContext';
import { useTimer } from '../src/contexts/TimerContext';
import { OtpAuthParams, Account } from '../src/types/account';
import { spacing } from '../src/theme/spacing';

type ModalState = 'idle' | 'scanning' | 'preview' | 'paywall';

export default function AccountsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { accounts, addAccount, isLoading } = useAccounts();
  const { isPremium, FREE_ACCOUNT_LIMIT } = usePremium();
  const { progress } = useTimer();
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [scannedParams, setScannedParams] = useState<OtpAuthParams | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = searchQuery.trim()
    ? accounts.filter(
        (a) =>
          a.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.account?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;

  const handleAddPress = useCallback(() => {
    if (!isPremium && accounts.length >= FREE_ACCOUNT_LIMIT) {
      setModalState('paywall');
    } else {
      setModalState('scanning');
    }
  }, [isPremium, accounts.length, FREE_ACCOUNT_LIMIT]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>
            Authenticator
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
            {isPremium
              ? `${accounts.length} accounts · Unlimited`
              : `${accounts.length} / ${FREE_ACCOUNT_LIMIT} accounts`}
          </Text>
        </View>
      ),
      headerRight: undefined,
    });
  }, [navigation, accounts.length, isPremium, FREE_ACCOUNT_LIMIT, colors]);

  const handleScanned = useCallback((params: OtpAuthParams) => {
    setScannedParams(params);
    setModalState('preview');
  }, []);

  const handleScannerClose = useCallback(() => {
    setModalState('idle');
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

  const timerWidth = `${progress * 100}%` as const;

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

      {/* Timer progress bar */}
      <View style={[styles.timerTrack, { backgroundColor: colors.surfaceBorder }]}>
        <View
          style={[styles.timerBar, { width: timerWidth, backgroundColor: colors.accent }]}
        />
      </View>

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
        />
      )}

      {/* FAB */}
      <Fab onPress={handleAddPress} colors={colors} />

      <QrScannerModal
        visible={modalState === 'scanning'}
        onScanned={handleScanned}
        onClose={handleScannerClose}
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
  timerTrack: {
    height: 3,
    marginHorizontal: spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  timerBar: {
    height: '100%',
    borderRadius: 2,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
