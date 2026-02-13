# Authenticator

A **TOTP (Time-based One-Time Password)** generator built with React Native + Expo. Implements [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) — the same algorithm behind Google Authenticator, Authy, and Microsoft Authenticator.

6-digit codes refresh every 30 seconds with a smooth animated progress ring and automatic dark/light theme.

---

## Installation

**Prerequisites:** Node.js 18+, [Expo Go](https://expo.dev/go) 54+ on your phone.

```bash
git clone https://github.com/shonanalyst/Authenticator.git
cd Authenticator
npm install
npx expo start
```

Scan the QR code with Expo Go. That's it.

**Troubleshooting:**
- Worklets mismatch error → `npx expo install react-native-worklets`
- Stale cache → `npx expo start -c`

---

## Tech Stack

| | Technology |
|---|---|
| **Framework** | Expo SDK 54, React Native 0.81, TypeScript 5.9 (strict) |
| **Crypto** | crypto-js (HMAC-SHA1) + hi-base32 — pure JS, no native deps |
| **Animations** | react-native-reanimated 4 (SVG progress ring + code fade) |
| **Target** | Android 14+ (minSdk 36, targetSdk 54), iOS with tablet support |

---

## How TOTP Works

1. **Decode** the Base32 secret into raw bytes
2. **Divide** current Unix time by 30 → time counter
3. **Sign** the counter with HMAC-SHA1 using the secret
4. **Truncate** the 20-byte hash into a 6-digit code (dynamic truncation per RFC 6238)
5. **Refresh** every second — code changes at exact 30-second boundaries

Verify with secret `JBSWY3DPEHPK3PXP` against Google Authenticator.

---

## Project Structure

```
src/
├── hooks/
│   ├── useTotp.ts            # TOTP generation + 1s timer
│   └── useAppTheme.ts        # Dark/Light theme from system settings
├── components/
│   ├── AuthenticatorCard.tsx  # Main card composing all sub-components
│   ├── ProgressRing.tsx       # Animated SVG circle countdown
│   ├── OtpDisplay.tsx         # "123 456" with fade animation on change
│   ├── CountdownTimer.tsx     # "Xs remaining" with warning color at ≤5s
│   └── IssuerLabel.tsx        # Service name + account label
├── theme/                     # colors, typography, spacing tokens
└── constants/config.ts        # Demo secret + TOTP parameters
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npx expo start` | Dev server (scan QR with Expo Go) |
| `npx expo run:android` | Native Android build |
| `npx expo run:ios` | Native iOS build |
| `npx tsc --noEmit` | Type-check |

---

## License

MIT
