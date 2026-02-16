// ── Google OAuth ──
// TODO: Replace with your actual Google Cloud Console Client IDs
export const GOOGLE_CLIENT_ID_ANDROID = '1013609465371-n138ubm1je5gv8cqqequ73c3rri556v8.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_IOS = '1013609465371-2m34flvd86pd8i4hbasfad8007qj78jk.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID_WEB = '1013609465371-l40t24br08hlhufutfup39j3psrem6ds.apps.googleusercontent.com';

export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ── Google Drive API ──
export const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
export const BACKUP_FILENAME = 'authenticator-backup.enc';

// ── Sync Crypto ──
export const SYNC_KEY_SALT = 'cloud-sync-key';
export const SYNC_KEY_INFO = 'authenticator-backup-v1';
export const CLOUD_BLOB_VERSION = 1;

// ── SecureStore Keys (OAuth tokens) ──
export const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';
export const GOOGLE_REFRESH_TOKEN_KEY = 'google_refresh_token';
export const GOOGLE_USER_EMAIL_KEY = 'google_user_email';
export const GOOGLE_TOKEN_EXPIRY_KEY = 'google_token_expiry';
