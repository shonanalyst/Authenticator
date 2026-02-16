import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import * as ExpoCrypto from 'expo-crypto';
import { Account, OtpAuthParams } from '../types/account';
import { encryptSecret } from '../crypto/encryption';
import { ensureUMK, retrieveUMK } from '../crypto/keyManager';
import { loadAccounts, saveAccounts } from '../storage/accountStorage';

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  umk: Uint8Array | null;
}

type AccountsAction =
  | { type: 'INIT'; payload: { accounts: Account[]; umk: Uint8Array } }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'REMOVE_ACCOUNT'; payload: string }
  | { type: 'REPLACE_ACCOUNTS'; payload: Account[] }
  | { type: 'CLEAR_UMK' }
  | { type: 'SET_UMK'; payload: Uint8Array };

function accountsReducer(state: AccountsState, action: AccountsAction): AccountsState {
  switch (action.type) {
    case 'INIT':
      return { accounts: action.payload.accounts, umk: action.payload.umk, isLoading: false };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [action.payload, ...state.accounts] };
    case 'REMOVE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };
    case 'REPLACE_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'CLEAR_UMK':
      return { ...state, umk: null };
    case 'SET_UMK':
      return { ...state, umk: action.payload };
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
  replaceAccounts: (accounts: Account[]) => Promise<void>;
  clearUMK: () => void;
  reloadUMK: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue>({
  accounts: [],
  isLoading: true,
  umk: null,
  addAccount: async () => {},
  removeAccount: async () => {},
  replaceAccounts: async () => {},
  clearUMK: () => {},
  reloadUMK: async () => {},
});

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

      const accounts = storedAccounts;

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

  const clearUMK = useCallback(() => {
    dispatch({ type: 'CLEAR_UMK' });
  }, []);

  const reloadUMK = useCallback(async () => {
    const umk = await retrieveUMK();
    if (umk) dispatch({ type: 'SET_UMK', payload: umk });
  }, []);

  const removeAccount = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVE_ACCOUNT', payload: id });
    await saveAccounts(accountsRef.current.filter(a => a.id !== id));
  }, []);

  const replaceAccounts = useCallback(async (accounts: Account[]) => {
    dispatch({ type: 'REPLACE_ACCOUNTS', payload: accounts });
    await saveAccounts(accounts);
  }, []);

  return (
    <AccountsContext.Provider
      value={{
        accounts: state.accounts,
        isLoading: state.isLoading,
        umk: state.umk,
        addAccount,
        removeAccount,
        replaceAccounts,
        clearUMK,
        reloadUMK,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts(): AccountsContextValue {
  return useContext(AccountsContext);
}
