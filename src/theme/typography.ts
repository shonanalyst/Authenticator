import { TextStyle, Platform } from 'react-native';

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography: Record<string, TextStyle> = {
  codeDisplay: {
    fontSize: 48,
    fontWeight: '300',
    fontFamily: monoFont,
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  countdown: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  issuer: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
  },
};
