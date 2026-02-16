import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';
import { useNavigation } from 'expo-router';
import { AccountListItem } from '../src/components/AccountListItem';
import { EmptyState } from '../src/components/EmptyState';
import { QrScannerModal } from '../src/components/QrScannerModal';
import { AccountPreviewModal } from '../src/components/AccountPreviewModal';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useAccounts } from '../src/contexts/AccountsContext';
import { OtpAuthParams, Account } from '../src/types/account';
import { spacing } from '../src/theme/spacing';

type ModalState = 'idle' | 'scanning' | 'preview';

export default function AccountsScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const { accounts, addAccount, isLoading } = useAccounts();
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [scannedParams, setScannedParams] = useState<OtpAuthParams | null>(null);

  const handleAddPress = useCallback(() => {
    setModalState('scanning');
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleAddPress} hitSlop={8} style={{ marginRight: spacing.md }}>
          <Text style={{ fontSize: 28, color: colors.accent, fontWeight: '300' }}>+</Text>
        </Pressable>
      ),
    });
  }, [navigation, handleAddPress, colors.accent]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
