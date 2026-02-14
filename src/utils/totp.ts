import CryptoJS from 'crypto-js';
import base32 from 'hi-base32';

export function generateTOTP(secret: string, unixTime: number, period = 30, digits = 6): string {
  try {
    const bytes: number[] = base32.decode.asBytes(secret.toUpperCase().replace(/\s/g, ''));
    const secretWords = CryptoJS.enc.Latin1.parse(
      String.fromCharCode(...bytes),
    );

    const counter = Math.floor(unixTime / period);
    const counterHex = counter.toString(16).padStart(16, '0');
    const counterWords = CryptoJS.enc.Hex.parse(counterHex);

    const hmac = CryptoJS.HmacSHA1(counterWords, secretWords);
    const hmacHex = hmac.toString(CryptoJS.enc.Hex);

    const offset = parseInt(hmacHex.charAt(hmacHex.length - 1), 16);
    const truncated = parseInt(hmacHex.substring(offset * 2, offset * 2 + 8), 16);
    const code = (truncated & 0x7fffffff) % Math.pow(10, digits);

    return code.toString().padStart(digits, '0');
  } catch {
    return '------';
  }
}
