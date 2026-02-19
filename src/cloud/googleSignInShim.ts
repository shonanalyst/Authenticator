/**
 * Shim for @react-native-google-signin/google-signin.
 *
 * In Expo Go the native module (RNGoogleSignin) is not available,
 * so we catch the import error and expose a flag + no-op stubs so
 * the rest of the app can start without crashing.
 */

let _GoogleSignin: any = null;
let _statusCodes: any = {};
let _isSuccessResponse: (r: any) => boolean = () => false;
let _isAvailable = false;

try {
  const mod = require('@react-native-google-signin/google-signin');
  _GoogleSignin = mod.GoogleSignin;
  _statusCodes = mod.statusCodes ?? {};
  _isSuccessResponse = mod.isSuccessResponse ?? (() => false);
  _isAvailable = true;
} catch {
  // Native module not available (Expo Go) — provide no-op stubs
  _GoogleSignin = {
    configure: () => {},
    hasPlayServices: async () => false,
    signIn: async () => { throw new Error('Google Sign-In is not available in Expo Go'); },
    signInSilently: async () => { throw new Error('Google Sign-In is not available in Expo Go'); },
    signOut: async () => {},
    revokeAccess: async () => {},
    getTokens: async () => { throw new Error('Google Sign-In is not available in Expo Go'); },
    getCurrentUser: () => null,
  };
  _statusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  };
}

export const GoogleSignin = _GoogleSignin;
export const statusCodes = _statusCodes;
export const isSuccessResponse = _isSuccessResponse;

/** true when the native Google Sign-In module is linked (development build) */
export const isGoogleSignInAvailable = _isAvailable;
