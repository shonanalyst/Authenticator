import { useMemo } from 'react';
import { generateTOTP } from '../utils/totp';

export function useTotp(secret: string, unixTime: number, period = 30, digits = 6): string {
  return useMemo(() => generateTOTP(secret, unixTime, period, digits), [secret, unixTime, period, digits]);
}
