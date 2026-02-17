import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAccounts } from './AccountsContext';
import { useSecurity } from './SecurityContext';
import {
  fetchUserEmail,
  storeAuthTokens,
  signOut as googleSignOut,
  loadStoredAuthState,
} from '../cloud/googleAuth';
import { performBackup, performRestore, checkBackupStatus } from '../cloud/syncOrchestrator';
import { checkRootStatus } from '../security/rootDetection';
import type { Account } from '../types/account';
import type { SyncResult, BackupInfo } from '../cloud/syncOrchestrator';
import {
  GOOGLE_CLIENT_ID_WEB,
  GOOGLE_SCOPES,
} from '../constants/cloudSync';

// Configure Google Sign-In once at module level
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID_WEB,
  offlineAccess: true,
  scopes: GOOGLE_SCOPES,
});

// ── Types ──

interface CloudSyncContextValue {
  // Auth state
  isSignedIn: boolean;
  userEmail: string | null;
  isAuthLoading: boolean;

  // Sync state
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  syncError: string | null;

  // Security state
  isDeviceRooted: boolean;
  isSecurityCheckComplete: boolean;

  // Actions
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  backup: () => Promise<SyncResult>;
  restore: () => Promise<{ accounts: Account[]; timestamp: number }>;
  checkBackup: () => Promise<BackupInfo>;
}

const CloudSyncContext = createContext<CloudSyncContextValue>({
  isSignedIn: false,
  userEmail: null,
  isAuthLoading: true,
  isSyncing: false,
  lastSyncTimestamp: null,
  syncError: null,
  isDeviceRooted: false,
  isSecurityCheckComplete: false,
  signIn: async () => {},
  signOut: async () => {},
  backup: async () => ({ success: false }),
  restore: async () => ({ accounts: [], timestamp: 0 }),
  checkBackup: async () => ({ exists: false }),
});

// ── Provider ──

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { accounts, umk } = useAccounts();
  const { isLocked } = useSecurity();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDeviceRooted, setIsDeviceRooted] = useState(false);
  const [isSecurityCheckComplete, setIsSecurityCheckComplete] = useState(false);

  // Check root status on mount
  useEffect(() => {
    (async () => {
      const rooted = await checkRootStatus();
      setIsDeviceRooted(rooted);
      setIsSecurityCheckComplete(true);
    })();
  }, []);

  // Restore auth state on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadStoredAuthState();
        setIsSignedIn(stored.isSignedIn);
        setUserEmail(stored.email);
      } catch {
        // Silent fail — not signed in
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  // ── Actions ──

  const signIn = useCallback(async () => {
    if (isDeviceRooted) {
      setSyncError('Cloud sync is disabled on rooted devices for security.');
      return;
    }
    setSyncError(null);
    setIsAuthLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        throw new Error('Sign-in was cancelled');
      }

      // Get tokens (access token + server auth code for offline access)
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;

      // serverAuthCode gives us a refresh token via exchange
      const serverAuthCode = response.data?.serverAuthCode;

      let refreshToken = '';
      let expiresIn = 3600;

      if (serverAuthCode) {
        // Exchange server auth code for refresh token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: serverAuthCode,
            client_id: GOOGLE_CLIENT_ID_WEB,
            grant_type: 'authorization_code',
          }).toString(),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          refreshToken = tokenData.refresh_token || '';
          expiresIn = tokenData.expires_in || 3600;
        }
      }

      const email = response.data?.user?.email || await fetchUserEmail(accessToken);
      await storeAuthTokens(accessToken, refreshToken, email, expiresIn);
      setIsSignedIn(true);
      setUserEmail(email);
      setSyncError(null);
    } catch (e: unknown) {
      const error = e as { code?: string; message?: string };
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — not an error
        return;
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      setSyncError(error.message || 'Sign-in failed');
    } finally {
      setIsAuthLoading(false);
    }
  }, [isDeviceRooted]);

  const signOut = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      // Revoke access first (removes app permissions), then sign out
      try { await GoogleSignin.revokeAccess(); } catch { /* non-fatal */ }
      try { await GoogleSignin.signOut(); } catch { /* non-fatal */ }
      // Clear all stored tokens from SecureStore
      await googleSignOut();
    } catch {
      // Even if cleanup fails, still reset local state
    }
    setIsSignedIn(false);
    setUserEmail(null);
    setLastSyncTimestamp(null);
    setSyncError(null);
    setIsAuthLoading(false);
  }, []);

  const backup = useCallback(async (): Promise<SyncResult> => {
    if (isDeviceRooted) {
      return { success: false, error: 'Cloud sync is disabled on rooted devices for security.' };
    }
    if (isLocked || !umk) {
      return { success: false, error: 'App is locked. Unlock to sync.' };
    }
    if (!isSignedIn) {
      return { success: false, error: 'Not signed in to Google.' };
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const result = await performBackup(accounts, umk);
      if (result.success && result.timestamp) {
        setLastSyncTimestamp(result.timestamp);
      }
      if (!result.success && result.error) {
        setSyncError(result.error);
      }
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Backup failed';
      setSyncError(error);
      return { success: false, error };
    } finally {
      setIsSyncing(false);
    }
  }, [isDeviceRooted, isLocked, umk, isSignedIn, accounts]);

  const restore = useCallback(async (): Promise<{ accounts: Account[]; timestamp: number }> => {
    if (isDeviceRooted) {
      throw new Error('Cloud sync is disabled on rooted devices for security.');
    }
    if (isLocked || !umk) {
      throw new Error('App is locked. Unlock to restore.');
    }
    if (!isSignedIn) {
      throw new Error('Not signed in to Google.');
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const result = await performRestore(umk);
      setLastSyncTimestamp(result.timestamp);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Restore failed';
      setSyncError(error);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  }, [isDeviceRooted, isLocked, umk, isSignedIn]);

  const checkBackup = useCallback(async (): Promise<BackupInfo> => {
    if (!isSignedIn) return { exists: false };
    return checkBackupStatus();
  }, [isSignedIn]);

  return (
    <CloudSyncContext.Provider
      value={{
        isSignedIn,
        userEmail,
        isAuthLoading,
        isSyncing,
        lastSyncTimestamp,
        syncError,
        isDeviceRooted,
        isSecurityCheckComplete,
        signIn,
        signOut,
        backup,
        restore,
        checkBackup,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync(): CloudSyncContextValue {
  return useContext(CloudSyncContext);
}
