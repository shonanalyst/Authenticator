# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npx expo start          # Start dev server (press 'a' for Android, 'i' for iOS)
npx expo start -c       # Start with cleared Metro cache
npx expo run:android    # Native Android build
npx expo run:ios        # Native iOS build
npx tsc --noEmit        # Type-check without emitting
```

## Architecture

Multi-account TOTP authenticator with QR scanning, built with Expo SDK 54, React Native 0.81, TypeScript 5.9, targeting Android minSdk 36 / targetSdk 54.

### Data Flow

`TimerContext` runs ONE global `setInterval` providing `{ unixTime, secondsRemaining, progress }` to all components. `AccountsContext` manages the account list via `useReducer` (add/remove/init actions) with AsyncStorage persistence. On mount it loads encrypted accounts from AsyncStorage and the UMK from SecureStore. `useDecryptedTotp(account, umk, unixTime)` decrypts per time-step and generates the TOTP code — plaintext secret exists only briefly in function scope. `useTotp(secret, unixTime)` remains for preview mode (pre-encryption).

`HomeScreen` manages a modal state machine (`idle` → `scanning` → `preview` → `idle`) with FlatList of `AccountListItem` components.

Theme is derived from system `useColorScheme()` (dark default) via `useAppTheme()` hook, which returns colors/typography/spacing objects passed as props.

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

- **User Master Key (UMK)**: 32 random bytes generated once on first launch, stored only in `expo-secure-store`. Cached in `AccountsContext` state at startup. Never logged, never in AsyncStorage.
- **Secret encryption**: Each account's TOTP secret is encrypted with AES-256-GCM using a fresh random 12-byte IV. Stored as `{ encryptedSecret, iv, authTag }` (all base64) in AsyncStorage.
- **Decryption flow**: `useDecryptedTotp` hook decrypts per TOTP period (every 30s), passes plaintext to `generateTOTP()`, plaintext goes out of scope immediately.
- **Error handling**: Missing UMK with existing accounts = fatal error (no silent regeneration). Decryption failure = "ERROR" displayed in UI.
- **Do not use** `crypto.subtle` (unavailable in Hermes), `otplib`, or `react-native-aes-gcm-crypto` (requires custom dev client).

### Babel

`react-native-reanimated/plugin` must be the **last** plugin in `babel.config.js`.

## Project Structure

```
App.tsx                          # Provider wrapper (SafeArea > Timer > Accounts > HomeScreen)
src/
├── types/account.ts             # Account (encrypted fields), OtpAuthParams interfaces
├── crypto/
│   ├── keyManager.ts            # UMK generation, storage (SecureStore), retrieval
│   └── encryption.ts            # AES-256-GCM encrypt/decrypt via @noble/ciphers
├── storage/
│   └── accountStorage.ts        # AsyncStorage persistence for encrypted accounts
├── utils/
│   ├── totp.ts                  # Pure generateTOTP(secret, unixTime, period, digits)
│   └── parseOtpAuthUri.ts       # otpauth:// URI parser + validation
├── contexts/
│   ├── TimerContext.tsx          # Global 1s timer (one setInterval for all accounts)
│   └── AccountsContext.tsx      # Async reducer + encryption + AsyncStorage persistence
├── hooks/
│   ├── useDecryptedTotp.ts      # Decrypt + generate TOTP per time-step (for list items)
│   ├── useTotp.ts               # useMemo wrapper around generateTOTP (for preview)
│   └── useAppTheme.ts           # Dark/Light theme from system settings
├── screens/
│   └── HomeScreen.tsx           # FlatList + modal state machine (idle/scanning/preview)
├── components/
│   ├── AccountListItem.tsx      # Compact list row with mini ring, long-press to delete
│   ├── AuthenticatorCard.tsx    # Full card (used in preview modal)
│   ├── ProgressRing.tsx         # Animated SVG circle countdown
│   ├── OtpDisplay.tsx           # "123 456" with fade animation
│   ├── CountdownTimer.tsx       # "Xs remaining" with warning color at ≤5s
│   ├── IssuerLabel.tsx          # Service name + account label
│   ├── EmptyState.tsx           # "No accounts yet" placeholder
│   ├── Fab.tsx                  # Floating action button (+)
│   ├── QrScannerModal.tsx       # Fullscreen camera modal with permission flow
│   └── AccountPreviewModal.tsx  # Bottom sheet preview with Add/Cancel
├── theme/                       # colors, typography, spacing tokens
└── constants/config.ts          # TOTP parameters
```

## Key Constraints

- Encrypted accounts persisted in AsyncStorage, UMK in SecureStore — no backend
- `buffer` package must remain installed — it's a dependency of `react-native-svg`
- Dark mode is default (`scheme !== 'light'`)
- Demo account `JBSWY3DPEHPK3PXP` seeded in `AccountsContext` — verify TOTP output against Google Authenticator
- One global timer for all accounts — never create per-account intervals
