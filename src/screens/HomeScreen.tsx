import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountListItem } from '../components/AccountListItem';
import { EmptyState } from '../components/EmptyState';
import { Fab } from '../components/Fab';
import { QrScannerModal } from '../components/QrScannerModal';
import { AccountPreviewModal } from '../components/AccountPreviewModal';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAccounts } from '../contexts/AccountsContext';
import { OtpAuthParams } from '../types/account';
import { Account } from '../types/account';
import { spacing } from '../theme/spacing';

type ModalState = 'idle' | 'scanning' | 'preview';

export function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const { accounts, addAccount, isLoading } = useAccounts();
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [scannedParams, setScannedParams] = useState<OtpAuthParams | null>(null);

  const handleFabPress = useCallback(() => {
    setModalState('scanning');
  }, []);

  const handleScanned = useCallback((params: OtpAuthParams) => {
    setScannedParams(params);
    setModalState('preview');
  }, []);

  const handleScannerClose = useCallback(() => {
    setModalState('idle');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (scannedParams) {
      await addAccount(scannedParams);
    }
    setScannedParams(null);
    setModalState('idle');
  }, [scannedParams, addAccount]);

  const handleCancel = useCallback(() => {
    setScannedParams(null);
    setModalState('idle');
  }, []);

  const renderItem = useCallback(({ item }: { item: Account }) => (
    <AccountListItem account={item} colors={colors} />
  ), [colors]);

  const keyExtractor = useCallback((item: Account) => item.id, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : accounts.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          <FlatList
            data={accounts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Fab onPress={handleFabPress} colors={colors} />
      </View>

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

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
