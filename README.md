# Authenticator

A security-focused **TOTP (Time-based One-Time Password)** authenticator for Android, built with React Native and Expo. Implements [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) — the same standard behind Google Authenticator, Authy, and Microsoft Authenticator.

Manage all your two-factor authentication codes in one place with military-grade encryption, biometric protection, and encrypted cloud backup.

---

## Features

- **Multi-account management** — Add unlimited accounts via QR code scanning
- **AES-256-GCM encryption** — Every TOTP secret is encrypted at rest, never stored in plaintext
- **PIN & biometric lock** — Protect access with a PIN code and optional fingerprint/Face ID
- **Encrypted cloud backup** — Back up to Google Drive with end-to-end encryption
- **Smooth animations** — Animated countdown ring and code transitions
- **Dark & light theme** — Follows system preference, dark by default
- **Offline-first** — Works entirely offline, no server required

---

## Security Architecture

Security is the core design principle. Every layer is built to ensure your secrets remain protected.

### Encryption at Rest

All TOTP secrets are encrypted using **AES-256-GCM** via [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) — a pure JavaScript, independently audited cryptographic library with zero dependencies.

| Component | Protection |
|---|---|
| **TOTP secrets** | AES-256-GCM with unique 12-byte IV per account |
| **User Master Key (UMK)** | 32 random bytes, stored exclusively in platform Keychain/Keystore via `expo-secure-store` |
| **PIN hash** | SHA-256(PIN + 16-byte random salt), stored in Keychain/Keystore |
| **OAuth tokens** | Stored in Keychain/Keystore, never in AsyncStorage |

### Key Management

- A **User Master Key (UMK)** is generated once on first launch using cryptographically secure random bytes
- The UMK is stored **only** in the platform's secure hardware-backed storage (Android Keystore / iOS Keychain)
- The UMK is **never** written to AsyncStorage, logged, or transmitted over the network
- Each account secret is encrypted with its own random IV — compromising one does not affect others

### Memory Protection

- When the app is locked, the UMK is **cleared from memory** — TOTP codes cannot be generated until unlock
- Decrypted secrets exist only briefly in function scope during code generation, then go out of scope
- Auto-lock triggers immediately when the app moves to background

### Brute-Force Protection

- 5 failed PIN attempts trigger a **30-second lockout** with countdown
- PIN verification uses constant-time comparison via cryptographic hashing

### Cloud Backup Security

- Backups are encrypted **before** leaving the device using a key derived from the UMK via HKDF
- Google Drive stores only the **encrypted blob** — Google cannot read your secrets
- End-to-end encryption: only a device with your UMK can decrypt the backup
- Backups are stored in Google Drive's AppData folder (hidden, app-specific storage)

---

## Installation

**Prerequisites:** Node.js 18+, Android device or emulator

```bash
git clone https://github.com/shonanalyst/Authenticator.git
cd Authenticator
npm install
```

### Development Build (recommended)

```bash
npx expo run:android
```

This builds and installs the app directly on a USB-connected Android device. Required for Google Sign-In and full native functionality.

### Expo Go (limited)

```bash
npx expo start
```

Scan the QR code with Expo Go. Note: Google Sign-In cloud backup is not available in Expo Go — it requires a native build.

---

## Tech Stack

| | Technology |
|---|---|
| **Framework** | Expo SDK 54, React Native 0.81, TypeScript 5.9 (strict mode) |
| **Encryption** | @noble/ciphers (AES-256-GCM), @noble/hashes (HKDF, SHA-256) |
| **TOTP** | crypto-js (HMAC-SHA1) + hi-base32 — pure JS, RFC 6238 compliant |
| **Auth** | @react-native-google-signin/google-signin (native Google Play Services) |
| **Secure Storage** | expo-secure-store (Android Keystore / iOS Keychain) |
| **Animations** | react-native-reanimated 4 (SVG progress ring + code transitions) |
| **Navigation** | Expo Router with Drawer navigation |
| **Camera** | expo-camera (QR code scanning) |
| **Target** | Android 14+ (minSdk 36, targetSdk 54) |

---

## How TOTP Works

1. **Decode** the Base32 secret into raw bytes
2. **Divide** current Unix time by 30 to get a time counter
3. **Sign** the counter with HMAC-SHA1 using the secret key
4. **Truncate** the 20-byte hash into a 6-digit code (dynamic truncation per RFC 6238)
5. **Refresh** every second — code changes at exact 30-second boundaries

Compatible with any service that supports TOTP (Google, GitHub, AWS, Discord, Twitter/X, and thousands more).

---

## Project Structure

```
app/                             # Expo Router file-based routes
├── _layout.tsx                  # Root layout (providers + drawer + conditional rendering)
├── index.tsx                    # Accounts screen
├── settings.tsx                 # Settings (security, cloud sync, app info)
└── how-it-works.tsx             # Educational info screen

src/
├── cloud/                       # Google Drive backup system
│   ├── googleAuth.ts            # Token management via native Google Sign-In
│   ├── driveApi.ts              # Google Drive REST API wrapper
│   ├── syncOrchestrator.ts      # Backup/restore coordination
│   └── syncCrypto.ts            # HKDF key derivation + cloud encryption
├── crypto/
│   ├── keyManager.ts            # UMK generation & secure storage
│   └── encryption.ts            # AES-256-GCM encrypt/decrypt
├── contexts/
│   ├── AccountsContext.tsx       # Account state management + encryption
│   ├── SecurityContext.tsx       # PIN lock, biometric, auto-lock
│   ├── CloudSyncContext.tsx      # Google Sign-In + backup/restore
│   ├── TimerContext.tsx          # Global 1-second TOTP timer
│   └── ThemeContext.tsx          # Dark/Light theme
├── components/                  # Reusable UI components
├── screens/                     # Full-screen views (onboarding, unlock, sign-in)
├── hooks/                       # Custom React hooks
├── utils/                       # Pure utility functions (TOTP, URI parsing)
├── storage/                     # AsyncStorage persistence
├── theme/                       # Design tokens (colors, typography, spacing)
└── constants/                   # App configuration & API constants
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npx expo start` | Start dev server |
| `npx expo run:android` | Native Android build + install |
| `npx expo run:ios` | Native iOS build |
| `npx tsc --noEmit` | Type-check without emitting |

---

## Privacy

- **No analytics or tracking** — the app collects zero telemetry
- **No server** — all data is stored locally on your device
- **Cloud backup is optional** — and encrypted end-to-end before upload
- **Open source** — full source code available for audit

---

## License

MIT
