import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import * as ExpoCrypto from 'expo-crypto';
import { Account, OtpAuthParams } from '../types/account';
import { encryptSecret } from '../crypto/encryption';
import { ensureUMK } from '../crypto/keyManager';
import { loadAccounts, saveAccounts } from '../storage/accountStorage';

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  umk: Uint8Array | null;
}

type AccountsAction =
  | { type: 'INIT'; payload: { accounts: Account[]; umk: Uint8Array } }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'REMOVE_ACCOUNT'; payload: string };

function accountsReducer(state: AccountsState, action: AccountsAction): AccountsState {
  switch (action.type) {
    case 'INIT':
      return { accounts: action.payload.accounts, umk: action.payload.umk, isLoading: false };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [action.payload, ...state.accounts] };
    case 'REMOVE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };
    default:
      return state;
  }
}

interface AccountsContextValue {
  accounts: Account[];
  isLoading: boolean;
  umk: Uint8Array | null;
  addAccount: (params: OtpAuthParams) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue>({
  accounts: [],
  isLoading: true,
  umk: null,
  addAccount: async () => {},
  removeAccount: async () => {},
});

const DEMO_SECRET = 'JBSWY3DPEHPK3PXP';

function createEncryptedDemoAccount(umk: Uint8Array): Account {
  const encrypted = encryptSecret(DEMO_SECRET, umk);
  return {
    id: 'demo',
    encryptedSecret: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    issuer: 'Acme Corp',
    account: 'user@example.com',
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  };
}

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(accountsReducer, {
    accounts: [],
    isLoading: true,
    umk: null,
  });

  // Ref tracks latest accounts to avoid stale closures in async callbacks
  const accountsRef = useRef<Account[]>(state.accounts);
  accountsRef.current = state.accounts;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedAccounts = await loadAccounts();
      const umk = await ensureUMK(storedAccounts.length > 0);

      let accounts: Account[];
      if (storedAccounts.length > 0) {
        accounts = storedAccounts;
      } else {
        const demo = createEncryptedDemoAccount(umk);
        accounts = [demo];
        await saveAccounts(accounts);
      }

      if (!cancelled) {
        dispatch({ type: 'INIT', payload: { accounts, umk } });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const addAccount = useCallback(async (params: OtpAuthParams) => {
    if (!state.umk) throw new Error('UMK not loaded');

    const encrypted = encryptSecret(params.secret, state.umk);
    const account: Account = {
      id: ExpoCrypto.randomUUID(),
      encryptedSecret: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      issuer: params.issuer,
      account: params.account,
      algorithm: params.algorithm,
      digits: params.digits,
      period: params.period,
    };

    dispatch({ type: 'ADD_ACCOUNT', payload: account });
    await saveAccounts([account, ...accountsRef.current]);
  }, [state.umk]);

  const removeAccount = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVE_ACCOUNT', payload: id });
    await saveAccounts(accountsRef.current.filter(a => a.id !== id));
  }, []);

  return (
    <AccountsContext.Provider
      value={{
        accounts: state.accounts,
        isLoading: state.isLoading,
        umk: state.umk,
        addAccount,
        removeAccount,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts(): AccountsContextValue {
  return useContext(AccountsContext);
}
