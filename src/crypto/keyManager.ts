import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { uint8ToBase64, base64ToUint8 } from '../utils/base64';

const UMK_STORE_KEY = 'user_master_key';

async function storeUMK(key: Uint8Array): Promise<void> {
  await SecureStore.setItemAsync(UMK_STORE_KEY, uint8ToBase64(key), {
    requireAuthentication: false,
  });
}

export async function retrieveUMK(): Promise<Uint8Array | null> {
  const stored = await SecureStore.getItemAsync(UMK_STORE_KEY);
  if (!stored) return null;
  return base64ToUint8(stored);
}

/**
 * Ensure UMK exists. Generate if first launch, throw if lost with existing data.
 */
export async function ensureUMK(hasExistingAccounts: boolean): Promise<Uint8Array> {
  const existing = await retrieveUMK();
  if (existing) return existing;

  if (hasExistingAccounts) {
    throw new Error(
      'FATAL: User Master Key missing but encrypted accounts exist. Data is unrecoverable.',
    );
  }

  const umk = Crypto.getRandomBytes(32);
  await storeUMK(umk);
  return umk;
}
