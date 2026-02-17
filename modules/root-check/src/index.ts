import { requireNativeModule } from 'expo-modules-core';

const RootCheck = requireNativeModule('RootCheck');

export async function isRooted(): Promise<boolean> {
  return RootCheck.isRooted();
}
