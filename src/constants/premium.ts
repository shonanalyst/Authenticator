import { Platform } from 'react-native';

export const FREE_ACCOUNT_LIMIT = 5;

export const PREMIUM_PRODUCT_ID_IOS = 'com.shonanalyst.authenticator.premium';
export const PREMIUM_PRODUCT_ID_ANDROID = 'com.shonanalyst.authenticator.premium';

export const PREMIUM_SECURESTORE_KEY = 'premium_status';

export function getPremiumProductId(): string {
  return Platform.OS === 'android' ? PREMIUM_PRODUCT_ID_ANDROID : PREMIUM_PRODUCT_ID_IOS;
}
