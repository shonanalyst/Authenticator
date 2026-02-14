export interface Account {
  id: string;
  encryptedSecret: string; // base64 AES-256-GCM ciphertext
  iv: string;              // base64 12-byte IV
  authTag: string;         // base64 16-byte authentication tag
  issuer: string;
  account: string;
  algorithm: string;
  digits: number;
  period: number;
}

export interface OtpAuthParams {
  secret: string;
  issuer: string;
  account: string;
  algorithm: string;
  digits: number;
  period: number;
}
