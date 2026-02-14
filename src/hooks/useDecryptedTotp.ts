import { useState, useEffect, useRef } from 'react';
import { Account } from '../types/account';
import { decryptSecret } from '../crypto/encryption';
import { generateTOTP } from '../utils/totp';

/**
 * Decrypt an account's secret and generate its TOTP code.
 * Decryption happens once per TOTP period; plaintext exists only briefly in function scope.
 */
export function useDecryptedTotp(
  account: Account,
  umk: Uint8Array | null,
  unixTime: number,
): string {
  const [code, setCode] = useState('------');
  const taskIdRef = useRef(0);

  const period = account.period;
  const currentPeriod = Math.floor(unixTime / period);

  useEffect(() => {
    if (!umk) {
      setCode('------');
      return;
    }

    const taskId = ++taskIdRef.current;
    // Compute unixTime from period to avoid stale closure
    const periodUnixTime = currentPeriod * period;

    try {
      const plainSecret = decryptSecret(
        {
          ciphertext: account.encryptedSecret,
          iv: account.iv,
          authTag: account.authTag,
        },
        umk,
      );
      if (taskIdRef.current !== taskId) return;
      const totp = generateTOTP(plainSecret, periodUnixTime, account.period, account.digits);
      setCode(totp);
    } catch {
      if (taskIdRef.current === taskId) setCode('ERROR');
    }
  }, [umk, currentPeriod, period, account.encryptedSecret, account.iv, account.authTag, account.period, account.digits]);

  return code;
}
