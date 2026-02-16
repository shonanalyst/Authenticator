import { getValidAccessToken, refreshAccessToken } from './googleAuth';
import { encryptForCloud, decryptFromCloud } from './syncCrypto';
import { findBackupFile, uploadBackup, downloadBackup, deleteBackup, TokenExpiredError, BackupNotFoundError } from './driveApi';
import type { Account } from '../types/account';

// ── Types ──

export interface SyncResult {
  success: boolean;
  error?: string;
  timestamp?: number;
}

export interface BackupInfo {
  exists: boolean;
  timestamp?: number;
}

// ── Internal: Token Retry ──

/**
 * Execute a Drive operation with automatic token refresh on 401.
 * Max 1 retry to prevent infinite loops.
 */
async function withTokenRetry<T>(
  operation: (token: string) => Promise<T>,
): Promise<T> {
  try {
    const token = await getValidAccessToken();
    return await operation(token);
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      const newToken = await refreshAccessToken();
      return await operation(newToken);
    }
    throw e;
  }
}

// ── Public API ──

/**
 * Back up all accounts to Google Drive.
 * Encrypts with HKDF-derived SyncKey before upload.
 *
 * SECURITY: UMK never leaves the device. Only the encrypted blob is uploaded.
 */
export async function performBackup(
  accounts: Account[],
  umk: Uint8Array,
): Promise<SyncResult> {
  try {
    const blob = encryptForCloud(accounts, umk);

    const metadata = await withTokenRetry(async (token) => {
      const existing = await findBackupFile(token);
      return uploadBackup(token, blob, existing?.id);
    });

    return {
      success: true,
      timestamp: blob.timestamp,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Backup failed',
    };
  }
}

/**
 * Restore accounts from Google Drive backup.
 * Downloads, decrypts, and validates the backup before returning.
 *
 * The caller is responsible for replacing local accounts with the returned array.
 * This separation ensures the orchestrator doesn't directly mutate app state.
 */
export async function performRestore(
  umk: Uint8Array,
): Promise<{ accounts: Account[]; timestamp: number }> {
  const blob = await withTokenRetry(async (token) => {
    const file = await findBackupFile(token);
    if (!file) throw new BackupNotFoundError();
    return downloadBackup(token, file.id);
  });

  const accounts = decryptFromCloud(blob, umk);
  return { accounts, timestamp: blob.timestamp };
}

/**
 * Check if a backup exists and return its metadata.
 */
export async function checkBackupStatus(): Promise<BackupInfo> {
  try {
    const file = await withTokenRetry(async (token) => {
      return findBackupFile(token);
    });

    if (!file) return { exists: false };

    return {
      exists: true,
      timestamp: new Date(file.modifiedTime).getTime(),
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Delete the cloud backup.
 */
export async function deleteCloudBackup(): Promise<void> {
  await withTokenRetry(async (token) => {
    const file = await findBackupFile(token);
    if (file) await deleteBackup(token, file.id);
  });
}
