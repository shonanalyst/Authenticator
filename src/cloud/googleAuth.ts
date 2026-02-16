import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GOOGLE_DISCOVERY,
  GOOGLE_ACCESS_TOKEN_KEY,
  GOOGLE_REFRESH_TOKEN_KEY,
  GOOGLE_USER_EMAIL_KEY,
  GOOGLE_TOKEN_EXPIRY_KEY,
} from '../constants/cloudSync';

// ── Types ──

export interface GoogleAuthResult {
  accessToken: string;
  refreshToken: string;
  email: string;
}

export interface GoogleAuthState {
  isSignedIn: boolean;
  email: string | null;
}

// ── Token Access ──

/**
 * Fetch the user's email from Google userinfo endpoint.
 */
export async function fetchUserEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();
  return data.email || 'Unknown';
}

/**
 * Store all auth tokens and user info in SecureStore.
 * SECURITY: Tokens are stored in platform-backed secure storage (Keychain/Keystore),
 * never in AsyncStorage.
 */
export async function storeAuthTokens(
  accessToken: string,
  refreshToken: string,
  email: string,
  expiresIn: number,
): Promise<void> {
  const expiryMs = Date.now() + expiresIn * 1000;
  await Promise.all([
    SecureStore.setItemAsync(GOOGLE_ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(GOOGLE_REFRESH_TOKEN_KEY, refreshToken),
    SecureStore.setItemAsync(GOOGLE_USER_EMAIL_KEY, email),
    SecureStore.setItemAsync(GOOGLE_TOKEN_EXPIRY_KEY, expiryMs.toString()),
  ]);
}

// ── Token Refresh ──

/**
 * Get a valid access token using Google Sign-In native SDK.
 * The SDK handles token refresh automatically via Google Play Services.
 * Falls back to stored token if GoogleSignin.getTokens() fails.
 */
export async function getValidAccessToken(): Promise<string> {
  try {
    const tokens = await GoogleSignin.getTokens();
    if (tokens.accessToken) {
      // Update stored token for consistency
      await SecureStore.setItemAsync(GOOGLE_ACCESS_TOKEN_KEY, tokens.accessToken);
      return tokens.accessToken;
    }
  } catch {
    // Fall through to stored token
  }

  // Fallback: try stored token
  const accessToken = await SecureStore.getItemAsync(GOOGLE_ACCESS_TOKEN_KEY);
  if (!accessToken) {
    throw new Error('Not signed in. Please sign in with Google first.');
  }
  return accessToken;
}

/**
 * Refresh the access token. With native Google Sign-In,
 * getTokens() automatically refreshes, but we keep this
 * for the TokenExpiredError retry logic in syncOrchestrator.
 */
export async function refreshAccessToken(): Promise<string> {
  try {
    // Force silent sign-in to refresh the session
    await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();
    if (tokens.accessToken) {
      await SecureStore.setItemAsync(GOOGLE_ACCESS_TOKEN_KEY, tokens.accessToken);
      return tokens.accessToken;
    }
  } catch {
    // Silent sign-in failed
  }

  throw new Error('Session expired. Please sign in again.');
}

// ── Sign Out ──

/**
 * Sign out: revoke the token (best-effort) and clear all stored auth data.
 */
export async function signOut(): Promise<void> {
  const accessToken = await SecureStore.getItemAsync(GOOGLE_ACCESS_TOKEN_KEY);

  // Best-effort token revocation — don't block on failure
  if (accessToken) {
    try {
      await fetch(
        `${GOOGLE_DISCOVERY.revocationEndpoint}?token=${accessToken}`,
        { method: 'POST' },
      );
    } catch {
      // Revocation failure is non-fatal
    }
  }

  await clearStoredTokens();
}

async function clearStoredTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(GOOGLE_ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(GOOGLE_REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(GOOGLE_USER_EMAIL_KEY),
    SecureStore.deleteItemAsync(GOOGLE_TOKEN_EXPIRY_KEY),
  ]);
}

// ── Load Stored State ──

/**
 * Check if we have stored auth tokens (restore session across app restarts).
 * Also checks native Google Sign-In state.
 */
export async function loadStoredAuthState(): Promise<GoogleAuthState> {
  // First check native Google Sign-In
  try {
    const currentUser = GoogleSignin.getCurrentUser();
    if (currentUser?.user) {
      const email = currentUser.user.email;
      // Ensure email is stored
      await SecureStore.setItemAsync(GOOGLE_USER_EMAIL_KEY, email);
      // Get fresh token
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        await SecureStore.setItemAsync(GOOGLE_ACCESS_TOKEN_KEY, tokens.accessToken);
      }
      return { isSignedIn: true, email };
    }
  } catch {
    // Fall through to SecureStore check
  }

  const [accessToken, email] = await Promise.all([
    SecureStore.getItemAsync(GOOGLE_ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(GOOGLE_USER_EMAIL_KEY),
  ]);

  return {
    isSignedIn: !!accessToken,
    email: email || null,
  };
}
