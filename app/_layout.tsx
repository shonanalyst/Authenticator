import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { TimerProvider } from '../src/contexts/TimerContext';
import { AccountsProvider } from '../src/contexts/AccountsContext';
import { SecurityProvider, useSecurity } from '../src/contexts/SecurityContext';
import { CloudSyncProvider } from '../src/contexts/CloudSyncContext';
import { PremiumProvider } from '../src/contexts/PremiumContext';
import { useOnboardingCheck } from '../src/hooks/useOnboardingCheck';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { OnboardingFlow } from '../src/screens/OnboardingFlow';
import { UnlockScreen } from '../src/screens/UnlockScreen';
import { SignInScreen } from '../src/screens/SignInScreen';
import { useCloudSync } from '../src/contexts/CloudSyncContext';
import { spacing } from '../src/theme/spacing';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentRoute = props.state.routes[props.state.index]?.name;

  const DrawerIcon = ({ type, color }: { type: string; color: string }) => {
    const size = 20;
    if (type === 'lock') return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={2} />
        <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
    if (type === 'gear') return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={color} strokeWidth={2} />
        <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={color} strokeWidth={2} />
      </Svg>
    );
    if (type === 'shield') return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    );
    // lightbulb
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  };

  const items = [
    { key: 'index', label: 'Authenticator', iconType: 'lock' },
    { key: 'settings', label: 'Settings', iconType: 'gear' },
    { key: 'privacy', label: 'Privacy & Security', iconType: 'shield' },
    { key: 'how-it-works', label: 'How it Works', iconType: 'bulb' },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.drawerContent, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>Authenticator</Text>
      <View style={[styles.drawerSeparator, { backgroundColor: colors.surfaceBorder }]} />

      {items.map((item) => {
        const isActive = currentRoute === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => props.navigation.navigate(item.key)}
            style={({ pressed }) => [
              styles.drawerItem,
              {
                backgroundColor: isActive ? colors.accentDim : pressed ? colors.surface : 'transparent',
                borderRadius: 16,
              },
            ]}
          >
            <View style={styles.drawerItemIcon}>
              <DrawerIcon type={item.iconType} color={isActive ? colors.accent : colors.textSecondary} />
            </View>
            <Text
              style={[
                styles.drawerItemLabel,
                { color: isActive ? colors.accent : colors.textPrimary },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </DrawerContentScrollView>
  );
}

function RootGate() {
  const { colors, isDark } = useAppTheme();
  const { isLockEnabled, isLocked, isReady: isSecurityReady } = useSecurity();
  const { hasSeenOnboarding, isCheckingOnboarding, markOnboardingSeen } = useOnboardingCheck();
  const { isSignedIn } = useCloudSync();

  if (isCheckingOnboarding || !isSecurityReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return (
      <>
        <OnboardingFlow onComplete={markOnboardingSeen} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <SignInScreen />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  if (isLockEnabled && isLocked) {
    return (
      <>
        <UnlockScreen />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          drawerStyle: { backgroundColor: colors.background },
          sceneStyle: { backgroundColor: colors.background },
          swipeEnabled: true,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Authenticator',
            drawerLabel: 'Authenticator',
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerLabel: 'Settings',
          }}
        />
        <Drawer.Screen
          name="privacy"
          options={{
            title: 'Privacy & Security',
            drawerLabel: 'Privacy & Security',
          }}
        />
        <Drawer.Screen
          name="how-it-works"
          options={{
            title: 'How it Works',
            drawerLabel: 'How it Works',
            headerShown: false,
          }}
        />
      </Drawer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TimerProvider>
          <AccountsProvider>
            <SecurityProvider>
              <CloudSyncProvider>
                <PremiumProvider>
                  <RootGate />
                </PremiumProvider>
              </CloudSyncProvider>
            </SecurityProvider>
          </AccountsProvider>
        </TimerProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
  },
  drawerSeparator: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: 4,
  },
  drawerItemIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  drawerItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
