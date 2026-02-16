# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npx expo start          # Start dev server (press 'a' for Android, 'i' for iOS)
npx expo start -c       # Start with cleared Metro cache (required after main field change)
npx expo run:android    # Native Android build (requires USB-connected device or emulator)
npx expo run:ios        # Native iOS build
npx tsc --noEmit        # Type-check without emitting
```

**Note:** `npx expo run:android` requires `ANDROID_HOME` env var or `android/local.properties` with `sdk.dir`. The debug keystore SHA-1 must match the Google Cloud Console Android Client ID.

## Architecture

Multi-account TOTP authenticator with QR scanning and Google Drive cloud backup, built with Expo SDK 54, React Native 0.81, TypeScript 5.9, targeting Android minSdk 36 / targetSdk 54.

### Navigation (Phase 4)

**Expo Router** (file-based routing) with `app/` directory using **Drawer** navigation. Entry point: `"main": "expo-router/entry"` in package.json. Provider hierarchy in `app/_layout.tsx`: `SafeAreaProvider > ThemeProvider > TimerProvider > AccountsProvider > SecurityProvider > CloudSyncProvider > RootGate`.

`RootGate` conditionally renders:
1. **Loading spinner** — while checking onboarding/security state
2. **OnboardingFlow** — 4-page horizontal FlatList on first launch (`hasSeenOnboarding` in AsyncStorage)
3. **SignInScreen** — Google Sign-In prompt (skippable)
4. **UnlockScreen** — PIN/biometric unlock when `isLockEnabled && isLocked`
5. **`<Drawer />`** — normal routing (accounts index, settings, how-it-works)

Routes:
- `app/index.tsx` — Accounts screen (FlatList + modal state machine, header with gear/add buttons)
- `app/settings.tsx` — Settings screen (app lock toggle, biometric toggle, cloud sync, info section)
- `app/how-it-works.tsx` — How it works info screen

### Data Flow

`TimerContext` runs ONE global `setInterval` providing `{ unixTime, secondsRemaining, progress }` to all components. `AccountsContext` manages the account list via `useReducer` (add/remove/init/clear_umk/set_umk actions) with AsyncStorage persistence. On mount it loads encrypted accounts from AsyncStorage and the UMK from SecureStore. No demo account is seeded — the app starts with an empty list. Exposes `clearUMK()` and `reloadUMK()` for the security lock system. `useDecryptedTotp(account, umk, unixTime)` decrypts per time-step and generates the TOTP code — plaintext secret exists only briefly in function scope. `useTotp(secret, unixTime)` remains for preview mode (pre-encryption).

Theme is managed by `ThemeContext` (dark default) via `useAppTheme()` hook, which returns colors/typography/spacing objects passed as props.

### App Lock System (Phase 4)

`SecurityContext` manages PIN-based app lock with optional biometric unlock. Provider must be **inside** AccountsProvider (calls `clearUMK()`/`reloadUMK()`).

- **PIN storage**: SHA-256(pin + saltHex) stored in SecureStore (never AsyncStorage). 16-byte random salt per PIN.
- **Lock behavior**: On lock, UMK is cleared from memory → TOTP codes show "------". On unlock (correct PIN or biometric), UMK reloaded from SecureStore.
- **Auto-lock**: `AppState.addEventListener('change')` locks on `background`/`inactive`.
- **Brute-force protection**: 5 failed attempts → 30s lockout with countdown.
- **Biometric**: `expo-local-authentication` for Face ID / fingerprint. Toggle only visible when lock enabled AND hardware available.

### Cloud Sync (Phase 5)

Google Drive AppData backup/restore using **`@react-native-google-signin/google-signin`** (native Google Play Services — no browser redirect needed). **Do not use `expo-auth-session`** for Google auth — it requires `https://` redirect URIs which are incompatible with Expo Go and development builds.

- **Auth flow**: `GoogleSignin.signIn()` → native Google account picker → `GoogleSignin.getTokens()` for access token. No browser, no redirect URI.
- **Token management**: `GoogleSignin.getTokens()` auto-refreshes via Play Services. Access token cached in SecureStore for Drive API calls. `signInSilently()` used for session restoration.
- **Sign out**: `revokeAccess()` + `signOut()` + clear SecureStore. State is always reset even if cleanup fails.
- **Backup**: Accounts encrypted with HKDF-derived SyncKey (from UMK), uploaded as `authenticator-backup.enc` to Drive AppData folder. Uses multipart upload for new files, PATCH for updates.
- **Restore**: Downloads encrypted blob from Drive, decrypts with SyncKey, returns accounts array for caller to replace local state.
- **Google Cloud Console setup**: Android Client ID must have correct package name (`com.shonanalyst.Authenticator`) and SHA-1 fingerprint matching the signing keystore. Web Client ID is used as `webClientId` in `GoogleSignin.configure()` for `serverAuthCode` (offline access).

#### Cloud Sync Architecture

`CloudSyncContext` (must be inside SecurityProvider) manages auth state + sync operations. Calls `GoogleSignin` directly for sign-in/sign-out. `googleAuth.ts` handles token access via `getValidAccessToken()` (uses `GoogleSignin.getTokens()`). `syncOrchestrator.ts` coordinates backup/restore with automatic token retry on 401. `driveApi.ts` wraps Google Drive REST API. `syncCrypto.ts` handles HKDF key derivation + AES-256-GCM encryption for cloud blobs.

### TOTP Implementation

RFC 6238 TOTP is implemented as a pure function in `src/utils/totp.ts` using **crypto-js** (HMAC-SHA1) and **hi-base32** (`decode.asBytes()` for raw byte output). The hook `src/hooks/useTotp.ts` wraps it with `useMemo`. **Do not use otplib** — it's incompatible with Hermes due to Buffer/window dependencies in its UMD bundle.

### QR Scanning

`expo-camera` `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` scans `otpauth://totp/...` URIs. Parsed by `src/utils/parseOtpAuthUri.ts` using the `URL` constructor (available in Hermes). `expo-crypto` provides `crypto.randomUUID()` for account IDs.

### Animation Stack

- **react-native-reanimated v4** with `react-native-worklets@0.5.1` (must stay pinned to match Expo Go SDK 54 native binary)
- ProgressRing: `Animated.createAnimatedComponent(Circle)` from react-native-svg with `useAnimatedProps` driving `strokeDashoffset`
- OtpDisplay / AccountListItem: `withSequence` opacity fade triggered on code change

### Encryption (Phase 3)

AES-256-GCM encryption using **@noble/ciphers** (pure JS, audited, zero dependencies — works on Hermes without native modules). Random bytes via **expo-crypto** `getRandomBytes()`.

- **User Master Key (UMK)**: 32 random bytes generated once on first launch, stored only in `expo-secure-store`. Cached in `AccountsContext` state at startup, cleared on lock, reloaded on unlock. Never logged, never in AsyncStorage.
- **Secret encryption**: Each account's TOTP secret is encrypted with AES-256-GCM using a fresh random 12-byte IV. Stored as `{ encryptedSecret, iv, authTag }` (all base64) in AsyncStorage.
- **Decryption flow**: `useDecryptedTotp` hook decrypts per TOTP period (every 30s), passes plaintext to `generateTOTP()`, plaintext goes out of scope immediately.
- **Error handling**: Missing UMK with existing accounts = fatal error (no silent regeneration). Decryption failure = "ERROR" displayed in UI.
- **Do not use** `crypto.subtle` (unavailable in Hermes), `otplib`, or `react-native-aes-gcm-crypto` (requires custom dev client).

### Babel

`react-native-reanimated/plugin` must be the **last** plugin in `babel.config.js`.

## Project Structure

```
app/
├── _layout.tsx                  # Root layout (providers + Drawer + RootGate)
├── index.tsx                    # Accounts screen (FlatList + modal state machine)
├── settings.tsx                 # Settings screen (app lock, biometric, cloud sync, info)
└── how-it-works.tsx             # How it works info screen
src/
├── types/account.ts             # Account (encrypted fields), OtpAuthParams interfaces
├── crypto/
│   ├── keyManager.ts            # UMK generation, storage (SecureStore), retrieval
│   └── encryption.ts            # AES-256-GCM encrypt/decrypt via @noble/ciphers
├── cloud/
│   ├── googleAuth.ts            # Google Sign-In token management (native SDK)
│   ├── driveApi.ts              # Google Drive REST API (find/upload/download/delete)
│   ├── syncOrchestrator.ts      # Backup/restore coordination with token retry
│   └── syncCrypto.ts            # HKDF key derivation + cloud blob encryption
├── storage/
│   └── accountStorage.ts        # AsyncStorage persistence for encrypted accounts
├── utils/
│   ├── totp.ts                  # Pure generateTOTP(secret, unixTime, period, digits)
│   ├── parseOtpAuthUri.ts       # otpauth:// URI parser + validation
│   └── base64.ts                # Base64 encode/decode utilities
├── contexts/
│   ├── TimerContext.tsx          # Global 1s timer (one setInterval for all accounts)
│   ├── AccountsContext.tsx       # Async reducer + encryption + clearUMK/reloadUMK
│   ├── SecurityContext.tsx       # PIN lock, biometric, auto-lock on background
│   ├── CloudSyncContext.tsx      # Google Sign-In + Drive backup/restore state
│   └── ThemeContext.tsx          # Dark/Light theme provider
├── hooks/
│   ├── useDecryptedTotp.ts      # Decrypt + generate TOTP per time-step (for list items)
│   ├── useTotp.ts               # useMemo wrapper around generateTOTP (for preview)
│   ├── useAppTheme.ts           # Theme hook (colors/typography/spacing)
│   └── useOnboardingCheck.ts    # AsyncStorage flag for first-launch onboarding
├── screens/
│   ├── OnboardingFlow.tsx       # 4-page horizontal onboarding
│   ├── UnlockScreen.tsx         # PIN unlock UI with biometric option
│   └── SignInScreen.tsx         # Google Sign-In screen (skippable)
├── components/
│   ├── AccountListItem.tsx      # Compact list row with mini ring, long-press to delete
│   ├── AuthenticatorCard.tsx    # Full card (used in preview modal)
│   ├── ProgressRing.tsx         # Animated SVG circle countdown
│   ├── OtpDisplay.tsx           # "123 456" with fade animation
│   ├── CountdownTimer.tsx       # "Xs remaining" with warning color at ≤5s
│   ├── IssuerLabel.tsx          # Service name + account label
│   ├── EmptyState.tsx           # "No accounts yet" placeholder
│   ├── Fab.tsx                  # Floating action button
│   ├── PinPad.tsx               # Shared 3x4 numeric keypad with dot indicators
│   ├── PinSetupModal.tsx        # Two-step PIN creation modal (create + confirm)
│   ├── QrScannerModal.tsx       # Fullscreen camera modal with permission flow
│   └── AccountPreviewModal.tsx  # Bottom sheet preview with Add/Cancel
├── theme/                       # colors, typography, spacing tokens
└── constants/
    ├── config.ts                # TOTP parameters
    └── cloudSync.ts             # Google OAuth client IDs, Drive API URLs, SecureStore keys
```

## Key Constraints

- Encrypted accounts persisted in AsyncStorage, UMK in SecureStore — no backend
- PIN hash + salt stored in SecureStore (never AsyncStorage)
- `buffer` package must remain installed — it's a dependency of `react-native-svg`
- Dark mode is default (`scheme !== 'light'`)
- No demo account — app starts with empty account list
- One global timer for all accounts — never create per-account intervals
- SecurityProvider must be inside AccountsProvider (depends on clearUMK/reloadUMK)
- CloudSyncProvider must be inside SecurityProvider (depends on isLocked)
- **Do not use `expo-auth-session` for Google auth** — use `@react-native-google-signin/google-signin` (native SDK, no redirect URI issues)
- Google OAuth tokens managed via `GoogleSignin.getTokens()` (auto-refresh via Play Services), not manual refresh token exchange
