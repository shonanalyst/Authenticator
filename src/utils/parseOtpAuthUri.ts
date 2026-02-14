import { OtpAuthParams } from '../types/account';
import { generateTOTP } from './totp';

export function parseOtpAuthUri(uri: string): OtpAuthParams | null {
  try {
    const url = new URL(uri);

    if (url.protocol !== 'otpauth:') return null;

    const type = url.hostname || url.pathname.split('/')[0];
    if (type !== 'totp') return null;

    const secret = url.searchParams.get('secret');
    if (!secret) return null;

    // Parse label from path: /Issuer:account or /account
    const labelPath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    let issuer = url.searchParams.get('issuer') || '';
    let account = '';

    if (labelPath.includes(':')) {
      const [labelIssuer, ...rest] = labelPath.split(':');
      if (!issuer) issuer = labelIssuer;
      account = rest.join(':').trim();
    } else {
      account = labelPath;
    }

    if (!issuer) issuer = 'Unknown';

    const algorithm = (url.searchParams.get('algorithm') || 'sha1').toLowerCase();
    const digits = parseInt(url.searchParams.get('digits') || '6', 10);
    const period = parseInt(url.searchParams.get('period') || '30', 10);

    // Validate by generating a test code
    const testCode = generateTOTP(secret, Math.floor(Date.now() / 1000), period, digits);
    if (testCode === '------') return null;

    return { secret, issuer, account, algorithm, digits, period };
  } catch {
    return null;
  }
}
