import { gcm } from '@noble/ciphers/aes.js';
import * as Crypto from 'expo-crypto';
import { uint8ToBase64, base64ToUint8 } from '../utils/base64';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string;         // base64
  authTag: string;    // base64
}

/**
 * Encrypt a plaintext TOTP secret with AES-256-GCM.
 * Generates a fresh random 12-byte IV per call.
 */
export function encryptSecret(plaintext: string, key: Uint8Array): EncryptedData {
  if (!plaintext) throw new Error('Cannot encrypt empty plaintext');
  if (key.length !== KEY_LENGTH) throw new Error(`AES-256 requires ${KEY_LENGTH}-byte key`);

  const iv = Crypto.getRandomBytes(IV_LENGTH);
  const aes = gcm(key, iv);
  const encoder = new TextEncoder();
  const sealed = aes.encrypt(encoder.encode(plaintext));

  // @noble/ciphers appends 16-byte auth tag to ciphertext
  const ciphertextBytes = sealed.slice(0, sealed.length - TAG_LENGTH);
  const authTagBytes = sealed.slice(sealed.length - TAG_LENGTH);

  return {
    ciphertext: uint8ToBase64(ciphertextBytes),
    iv: uint8ToBase64(iv),
    authTag: uint8ToBase64(authTagBytes),
  };
}

/**
 * Decrypt AES-256-GCM encrypted secret.
 * Throws if authentication fails (tampered or corrupt data).
 */
export function decryptSecret(encrypted: EncryptedData, key: Uint8Array): string {
  if (!encrypted.ciphertext || !encrypted.iv || !encrypted.authTag) {
    throw new Error('Invalid encrypted data: missing fields');
  }
  if (key.length !== KEY_LENGTH) throw new Error(`AES-256 requires ${KEY_LENGTH}-byte key`);

  const ciphertextBytes = base64ToUint8(encrypted.ciphertext);
  const iv = base64ToUint8(encrypted.iv);
  const authTagBytes = base64ToUint8(encrypted.authTag);

  // Reconstruct sealed format: ciphertext + authTag
  const sealed = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  sealed.set(ciphertextBytes, 0);
  sealed.set(authTagBytes, ciphertextBytes.length);

  const aes = gcm(key, iv);
  const plaintext = aes.decrypt(sealed);

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}
