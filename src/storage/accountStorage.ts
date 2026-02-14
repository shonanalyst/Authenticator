import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account } from '../types/account';

const ACCOUNTS_KEY = 'encrypted_accounts';

export async function loadAccounts(): Promise<Account[]> {
  const json = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!json) return [];
  return JSON.parse(json) as Account[];
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
