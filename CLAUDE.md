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

Single-screen TOTP authenticator built with Expo SDK 54, React Native 0.81, TypeScript 5.9, targeting Android minSdk 36 / targetSdk 54.

### Data Flow

`useTotp(secret)` hook → computes `{code, secondsRemaining, progress}` every 1s via `setInterval` → passed through `AuthenticatorCard` → consumed by `OtpDisplay`, `ProgressRing`, `CountdownTimer`.

Theme is derived from system `useColorScheme()` (dark default) via `useAppTheme()` hook, which returns colors/typography/spacing objects passed as props.

### TOTP Implementation

RFC 6238 TOTP is implemented directly in `src/hooks/useTotp.ts` using **crypto-js** (HMAC-SHA1) and **hi-base32** (`decode.asBytes()` for raw byte output). **Do not use otplib** — it's incompatible with Hermes due to Buffer/window dependencies in its UMD bundle.

### Animation Stack

- **react-native-reanimated v4** with `react-native-worklets@0.5.1` (must stay pinned to match Expo Go SDK 54 native binary)
- ProgressRing: `Animated.createAnimatedComponent(Circle)` from react-native-svg with `useAnimatedProps` driving `strokeDashoffset`
- OtpDisplay: `withSequence` opacity fade triggered on code change

### Babel

`react-native-reanimated/plugin` must be the **last** plugin in `babel.config.js`.

## Key Constraints

- No storage, no encryption, no QR scanning, no backend
- `buffer` package must remain installed — it's a dependency of `react-native-svg`
- Dark mode is default (`scheme !== 'light'`)
- Demo secret `JBSWY3DPEHPK3PXP` — verify TOTP output against Google Authenticator
