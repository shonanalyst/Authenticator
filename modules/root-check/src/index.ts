let RootCheck: any = null;

try {
  const { requireNativeModule } = require('expo-modules-core');
  RootCheck = requireNativeModule('RootCheck');
} catch {
  // Native module not available (Expo Go)
}

export async function isRooted(): Promise<boolean> {
  if (!RootCheck) return false;
  return RootCheck.isRooted();
}
