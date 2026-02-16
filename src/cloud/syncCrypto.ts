import { gcm } from '@noble/ciphers/aes.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';
import { uint8ToBase64, base64ToUint8 } from '../utils/base64';
import { SYNC_KEY_SALT, SYNC_KEY_INFO, CLOUD_BLOB_VERSION } from '../constants/cloudSync';
import type { Account } from '../types/account';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface CloudBlob {
  version: number;
  iv: string;         // base64
  ciphertext: string; // base64
  authTag: string;    // base64
  timestamp: number;  // Unix ms
}

const encoder = new TextEncoder();

/**
 * Derive a 32-byte SyncKey from the UMK via HKDF-SHA256.
 * The SyncKey is cryptographically isolated from UMK —
 * compromising SyncKey does not reveal UMK.
 *
 * SECURITY: Never store the returned key. Derive on demand, use, discard.
 */
export function deriveSyncKey(umk: Uint8Array): Uint8Array {
  if (umk.length !== KEY_LENGTH) {
    throw new Error(`UMK must be ${KEY_LENGTH} bytes`);
  }
  return hkdf(
    sha256,
    umk,
    encoder.encode(SYNC_KEY_SALT),
    encoder.encode(SYNC_KEY_INFO),
    KEY_LENGTH,
  );
}

/**
 * Encrypt the full account list for cloud storage.
 * Double encryption: accounts already contain AES-256-GCM encrypted secrets (per UMK).
 * This adds a second layer with a derived SyncKey for transport security.
 */
export function encryptForCloud(accounts: Account[], umk: Uint8Array): CloudBlob {
  const syncKey = deriveSyncKey(umk);
  const plaintext = JSON.stringify(accounts);

  const iv = Crypto.getRandomBytes(IV_LENGTH);
  const aes = gcm(syncKey, iv);
  const sealed = aes.encrypt(encoder.encode(plaintext));

  const ciphertextBytes = sealed.slice(0, sealed.length - TAG_LENGTH);
  const authTagBytes = sealed.slice(sealed.length - TAG_LENGTH);

  return {
    version: CLOUD_BLOB_VERSION,
    iv: uint8ToBase64(iv),
    ciphertext: uint8ToBase64(ciphertextBytes),
    authTag: uint8ToBase64(authTagBytes),
    timestamp: Date.now(),
  };
}

/**
 * Decrypt a cloud blob back to an account list.
 * Validates blob version and account data shape before returning.
 *
 * Throws on:
 * - Version mismatch (unsupported format)
 * - AES-GCM auth tag failure (wrong key or tampered data)
 * - Invalid JSON or account structure (corrupted data)
 */
export function decryptFromCloud(blob: CloudBlob, umk: Uint8Array): Account[] {
  if (blob.version !== CLOUD_BLOB_VERSION) {
    throw new Error(
      `Unsupported backup version ${blob.version}. This app supports version ${CLOUD_BLOB_VERSION}.`,
    );
  }

  if (!blob.ciphertext || !blob.iv || !blob.authTag) {
    throw new Error('Invalid backup: missing encrypted fields');
  }

  const syncKey = deriveSyncKey(umk);
  const ciphertextBytes = base64ToUint8(blob.ciphertext);
  const iv = base64ToUint8(blob.iv);
  const authTagBytes = base64ToUint8(blob.authTag);

  const sealed = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  sealed.set(ciphertextBytes, 0);
  sealed.set(authTagBytes, ciphertextBytes.length);

  let plaintext: string;
  try {
    const aes = gcm(syncKey, iv);
    const decrypted = aes.decrypt(sealed);
    plaintext = new TextDecoder().decode(decrypted);
  } catch {
    throw new Error(
      'Failed to decrypt backup. This backup was likely created with a different device key.',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    throw new Error('Backup data is corrupted (invalid format).');
  }

  if (!validateAccountArray(parsed)) {
    throw new Error('Backup contains invalid account data.');
  }

  return parsed;
}

function validateAccountArray(data: unknown): data is Account[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.encryptedSecret === 'string' &&
      typeof item.iv === 'string' &&
      typeof item.authTag === 'string' &&
      typeof item.issuer === 'string' &&
      typeof item.account === 'string' &&
      typeof item.algorithm === 'string' &&
      typeof item.digits === 'number' &&
      typeof item.period === 'number',
  );
}
