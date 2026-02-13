import { useState, useEffect, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import base32 from 'hi-base32';

const PERIOD = 30;
const DIGITS = 6;

function generateTOTP(secret: string): string {
  try {
    const bytes: number[] = base32.decode.asBytes(secret.toUpperCase().replace(/\s/g, ''));
    const secretWords = CryptoJS.enc.Latin1.parse(
      String.fromCharCode(...bytes),
    );

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / PERIOD);
    const counterHex = counter.toString(16).padStart(16, '0');
    const counterWords = CryptoJS.enc.Hex.parse(counterHex);

    const hmac = CryptoJS.HmacSHA1(counterWords, secretWords);
    const hmacHex = hmac.toString(CryptoJS.enc.Hex);

    const offset = parseInt(hmacHex.charAt(hmacHex.length - 1), 16);
    const truncated = parseInt(hmacHex.substring(offset * 2, offset * 2 + 8), 16);
    const code = (truncated & 0x7fffffff) % Math.pow(10, DIGITS);

    return code.toString().padStart(DIGITS, '0');
  } catch {
    return '------';
  }
}

interface TotpState {
  code: string;
  secondsRemaining: number;
  progress: number;
}

export function useTotp(secret: string): TotpState {
  const computeState = useCallback((): TotpState => {
    const unixTime = Math.floor(Date.now() / 1000);
    const secondsRemaining = PERIOD - (unixTime % PERIOD);
    const progress = (PERIOD - secondsRemaining) / PERIOD;
    const code = generateTOTP(secret);
    return { code, secondsRemaining, progress };
  }, [secret]);

  const [state, setState] = useState<TotpState>(computeState);

  useEffect(() => {
    setState(computeState());
    const id = setInterval(() => {
      setState(computeState());
    }, 1000);
    return () => clearInterval(id);
  }, [computeState]);

  return state;
}
