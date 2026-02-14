import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TimerProvider } from './src/contexts/TimerContext';
import { AccountsProvider } from './src/contexts/AccountsContext';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <TimerProvider>
        <AccountsProvider>
          <HomeScreen />
        </AccountsProvider>
      </TimerProvider>
    </SafeAreaProvider>
  );
}
