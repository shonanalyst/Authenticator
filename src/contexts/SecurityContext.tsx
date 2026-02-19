import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAccounts } from './AccountsContext';
import { uint8ToBase64 } from '../utils/base64';

interface SecurityState {
  isLockEnabled: boolean;
  isBiometricEnabled: boolean;
  isBiometricAvailable: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lockUntil: number | null;
  isReady: boolean;
}

interface SecurityContextValue extends SecurityState {
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
}

const LOCK_ENABLED_KEY = 'lock_enabled';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const PIN_SALT_KEY = 'pin_salt';
const PIN_HASH_KEY = 'pin_hash';
const LOCKOUT_UNTIL_KEY = 'lockout_until';
const FAILED_ATTEMPTS_KEY = 'failed_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000;

const SecurityContext = createContext<SecurityContextValue>({
  isLockEnabled: false,
  isBiometricEnabled: false,
  isBiometricAvailable: false,
  isLocked: false,
  failedAttempts: 0,
  lockUntil: null,
  isReady: false,
  enableLock: async () => {},
  disableLock: async () => {},
  enableBiometric: async () => {},
  disableBiometric: async () => {},
  unlock: async () => false,
  unlockWithBiometric: async () => false,
});

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { clearUMK, reloadUMK } = useAccounts();
  const [state, setState] = useState<SecurityState>({
    isLockEnabled: false,
    isBiometricEnabled: false,
    isBiometricAvailable: false,
    isLocked: false,
    failedAttempts: 0,
    lockUntil: null,
    isReady: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const lock = useCallback(() => {
    if (!stateRef.current.isLockEnabled) return;
    setState(s => ({ ...s, isLocked: true }));
    clearUMK();
  }, [clearUMK]);

  // Initialize: check SecureStore for lock settings and biometric availability
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [lockEnabled, biometricEnabled, hasBiometric, storedLockUntil, storedFailedAttempts] = await Promise.all([
        SecureStore.getItemAsync(LOCK_ENABLED_KEY),
        SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
        LocalAuthentication.hasHardwareAsync(),
        SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY),
        SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY),
      ]);

      if (cancelled) return;

      const isLockEnabled = lockEnabled === 'true';
      const isBiometricEnabled = biometricEnabled === 'true' && hasBiometric;

      // Restore lockout state if still active
      const savedLockUntil = storedLockUntil ? parseInt(storedLockUntil, 10) : null;
      const lockUntil = savedLockUntil && savedLockUntil > Date.now() ? savedLockUntil : null;
      const failedAttempts = storedFailedAttempts ? parseInt(storedFailedAttempts, 10) : 0;

      // Clear expired lockout from storage
      if (savedLockUntil && savedLockUntil <= Date.now()) {
        SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
        SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
      }

      setState(s => ({
        ...s,
        isLockEnabled,
        isBiometricEnabled,
        isBiometricAvailable: hasBiometric,
        isLocked: isLockEnabled,
        failedAttempts: lockUntil ? failedAttempts : 0,
        lockUntil,
        isReady: true,
      }));

      if (isLockEnabled) {
        clearUMK();
      }
    })();

    return () => { cancelled = true; };
  }, [clearUMK]);

  // Auto-lock on app background only (NOT inactive).
  // On iOS, Face ID / Touch ID prompts cause a brief 'inactive' state.
  // Locking on 'inactive' would cancel the biometric unlock mid-flight.
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        lock();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [lock]);

  const enableLock = useCallback(async (pin: string) => {
    const saltBytes = ExpoCrypto.getRandomBytes(16);
    const saltBase64 = uint8ToBase64(saltBytes);
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const hash = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      pin + saltHex,
    );

    await Promise.all([
      SecureStore.setItemAsync(PIN_SALT_KEY, saltBase64),
      SecureStore.setItemAsync(PIN_HASH_KEY, hash),
      SecureStore.setItemAsync(LOCK_ENABLED_KEY, 'true'),
    ]);

    setState(s => ({ ...s, isLockEnabled: true }));
  }, []);

  const disableLock = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_SALT_KEY),
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
      SecureStore.setItemAsync(LOCK_ENABLED_KEY, 'false'),
      SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false'),
    ]);

    setState(s => ({
      ...s,
      isLockEnabled: false,
      isBiometricEnabled: false,
      isLocked: false,
      failedAttempts: 0,
      lockUntil: null,
    }));
  }, []);

  const enableBiometric = useCallback(async () => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    setState(s => ({ ...s, isBiometricEnabled: true }));
  }, []);

  const disableBiometric = useCallback(async () => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
    setState(s => ({ ...s, isBiometricEnabled: false }));
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    // Check lockout
    if (stateRef.current.lockUntil && Date.now() < stateRef.current.lockUntil) {
      return false;
    }

    const [saltBase64, storedHash] = await Promise.all([
      SecureStore.getItemAsync(PIN_SALT_KEY),
      SecureStore.getItemAsync(PIN_HASH_KEY),
    ]);

    if (!saltBase64 || !storedHash) return false;

    const saltBinary = atob(saltBase64);
    const saltBytes = new Uint8Array(saltBinary.length);
    for (let i = 0; i < saltBinary.length; i++) {
      saltBytes[i] = saltBinary.charCodeAt(i);
    }
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const hash = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      pin + saltHex,
    );

    if (hash === storedHash) {
      await Promise.all([
        reloadUMK(),
        SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY),
        SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY),
      ]);
      setState(s => ({ ...s, isLocked: false, failedAttempts: 0, lockUntil: null }));
      return true;
    }

    // Wrong PIN
    const newAttempts = stateRef.current.failedAttempts + 1;
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      await Promise.all([
        SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, lockUntil.toString()),
        SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, newAttempts.toString()),
      ]);
      setState(s => ({
        ...s,
        failedAttempts: newAttempts,
        lockUntil,
      }));
    } else {
      await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, newAttempts.toString());
      setState(s => ({ ...s, failedAttempts: newAttempts }));
    }
    return false;
  }, [reloadUMK]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!stateRef.current.isBiometricEnabled) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Authenticator',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: true,
      });

      if (result.success) {
        await Promise.all([
          reloadUMK(),
          SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY),
          SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY),
        ]);
        setState(s => ({ ...s, isLocked: false, failedAttempts: 0, lockUntil: null }));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [reloadUMK]);

  return (
    <SecurityContext.Provider
      value={{
        ...state,
        enableLock,
        disableLock,
        enableBiometric,
        disableBiometric,
        unlock,
        unlockWithBiometric,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity(): SecurityContextValue {
  return useContext(SecurityContext);
}
