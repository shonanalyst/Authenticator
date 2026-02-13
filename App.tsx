import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthenticatorCard } from './src/components/AuthenticatorCard';
import { useAppTheme } from './src/hooks/useAppTheme';
import { DEMO_SECRET, DEMO_ISSUER, DEMO_ACCOUNT } from './src/constants/config';

function HomeScreen() {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <AuthenticatorCard
          secret={DEMO_SECRET}
          issuer={DEMO_ISSUER}
          account={DEMO_ACCOUNT}
          colors={colors}
        />
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
