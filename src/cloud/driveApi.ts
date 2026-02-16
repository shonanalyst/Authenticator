import {
  DRIVE_API_BASE,
  DRIVE_UPLOAD_BASE,
  BACKUP_FILENAME,
} from '../constants/cloudSync';
import type { CloudBlob } from './syncCrypto';

// ── Error Classes ──

export class TokenExpiredError extends Error {
  constructor() {
    super('Access token expired');
    this.name = 'TokenExpiredError';
  }
}

export class DriveApiError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`Drive API error ${status}: ${body}`);
    this.name = 'DriveApiError';
    this.status = status;
  }
}

export class BackupNotFoundError extends Error {
  constructor() {
    super('No backup found in Google Drive');
    this.name = 'BackupNotFoundError';
  }
}

// ── Types ──

export interface DriveFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
}

// ── Internal Helpers ──

async function driveRequest(
  url: string,
  accessToken: string,
  options?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    throw new TokenExpiredError();
  }

  if (!response.ok) {
    const body = await response.text().catch(() => 'unknown');
    throw new DriveApiError(response.status, body);
  }

  return response;
}

// ── Public API ──

/**
 * Find the backup file in Google Drive AppData folder.
 * Returns metadata if found, null if no backup exists.
 */
export async function findBackupFile(
  accessToken: string,
): Promise<DriveFileMetadata | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${BACKUP_FILENAME}'`,
    fields: 'files(id,name,modifiedTime)',
    pageSize: '1',
  });

  const response = await driveRequest(
    `${DRIVE_API_BASE}/files?${params.toString()}`,
    accessToken,
  );

  const data = await response.json();
  const files = data.files as DriveFileMetadata[] | undefined;

  if (!files || files.length === 0) return null;
  return files[0];
}

/**
 * Upload an encrypted backup to Google Drive AppData folder.
 * Creates a new file or updates an existing one.
 */
export async function uploadBackup(
  accessToken: string,
  blob: CloudBlob,
  existingFileId?: string,
): Promise<DriveFileMetadata> {
  const blobJson = JSON.stringify(blob);

  if (existingFileId) {
    // Update existing file
    const response = await driveRequest(
      `${DRIVE_UPLOAD_BASE}/files/${existingFileId}?uploadType=media&fields=id,name,modifiedTime`,
      accessToken,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: blobJson,
      },
    );
    return (await response.json()) as DriveFileMetadata;
  }

  // Create new file with multipart upload
  const boundary = 'cloud_sync_boundary_' + Date.now();
  const metadata = JSON.stringify({
    name: BACKUP_FILENAME,
    parents: ['appDataFolder'],
  });

  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    metadata +
    '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    blobJson +
    '\r\n' +
    `--${boundary}--`;

  const response = await driveRequest(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,modifiedTime`,
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  return (await response.json()) as DriveFileMetadata;
}

/**
 * Download and parse the encrypted backup from Google Drive.
 * Throws BackupNotFoundError if file doesn't exist.
 */
export async function downloadBackup(
  accessToken: string,
  fileId: string,
): Promise<CloudBlob> {
  const response = await driveRequest(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    accessToken,
  );

  const data = await response.json();

  if (
    typeof data !== 'object' ||
    data === null ||
    typeof data.version !== 'number' ||
    typeof data.ciphertext !== 'string' ||
    typeof data.iv !== 'string' ||
    typeof data.authTag !== 'string' ||
    typeof data.timestamp !== 'number'
  ) {
    throw new Error('Downloaded backup has invalid format');
  }

  return data as CloudBlob;
}

/**
 * Delete a backup file from Google Drive.
 */
export async function deleteBackup(
  accessToken: string,
  fileId: string,
): Promise<void> {
  await driveRequest(`${DRIVE_API_BASE}/files/${fileId}`, accessToken, {
    method: 'DELETE',
  });
}
