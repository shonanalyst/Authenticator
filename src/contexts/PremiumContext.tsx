import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {
  FREE_ACCOUNT_LIMIT,
  PREMIUM_SECURESTORE_KEY,
  getPremiumProductId,
} from '../constants/premium';

// Detect Expo Go — NitroModules (react-native-iap) crash on Expo Go
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

interface PremiumContextValue {
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  products: IAPProduct[];
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  FREE_ACCOUNT_LIMIT: number;
}

// Minimal product type used internally (avoids importing from react-native-iap at top level)
interface IAPProduct {
  productId: string;
  displayPrice?: string;
  localizedPrice?: string;
  title?: string;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}

// ─── Expo Go stub (no IAP, always free) ──────────────────────────────────────
function ExpoGoProvider({ children }: { children: React.ReactNode }) {
  const noop = useCallback(async () => {}, []);
  return (
    <PremiumContext.Provider
      value={{
        isPremium: false,
        isLoading: false,
        isPurchasing: false,
        products: [],
        purchasePremium: noop,
        restorePurchases: noop,
        FREE_ACCOUNT_LIMIT,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

// ─── Real IAP provider (native build only) ───────────────────────────────────
function NativeIAPProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [products, setProducts] = useState<IAPProduct[]>([]);

  // Lazy refs for listener handles — typed as any to avoid top-level import
  const purchaseListenerRef = useRef<any>(null);
  const errorListenerRef = useRef<any>(null);

  const markPremium = useCallback(async () => {
    setIsPremium(true);
    await SecureStore.setItemAsync(PREMIUM_SECURESTORE_KEY, 'true');
  }, []);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        // Dynamic import keeps NitroModules from loading in Expo Go
        const iap = await import('react-native-iap');

        // Check cached premium first for fast startup
        const cached = await SecureStore.getItemAsync(PREMIUM_SECURESTORE_KEY);
        if (cached === 'true' && mounted) setIsPremium(true);

        await iap.initConnection();

        // Verify with store (handles reinstalls / refunds)
        const purchases = await iap.getAvailablePurchases();
        const productId = getPremiumProductId();
        const hasPremium = purchases.some((p) => p.productId === productId);
        if (mounted) {
          setIsPremium(hasPremium);
          if (hasPremium) {
            await SecureStore.setItemAsync(PREMIUM_SECURESTORE_KEY, 'true');
          } else {
            await SecureStore.deleteItemAsync(PREMIUM_SECURESTORE_KEY);
          }
        }

        // Fetch product info for price display
        const fetched = await iap.fetchProducts({ skus: [productId], type: 'in-app' });
        if (mounted && fetched) setProducts(fetched as unknown as IAPProduct[]);

        // Listen for purchase updates
        purchaseListenerRef.current = iap.purchaseUpdatedListener(
          async (purchase: any) => {
            if (purchase.productId === productId) {
              await iap.finishTransaction({ purchase, isConsumable: false });
              await markPremium();
            }
          }
        );

        errorListenerRef.current = iap.purchaseErrorListener((error: any) => {
          console.warn('[IAP] Purchase error:', error.message);
        });
      } catch (err) {
        console.warn('[IAP] Setup error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    setup();

    return () => {
      mounted = false;
      purchaseListenerRef.current?.remove();
      errorListenerRef.current?.remove();
      import('react-native-iap').then((iap) => iap.endConnection()).catch(() => {});
    };
  }, [markPremium]);

  const purchasePremium = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const iap = await import('react-native-iap');
      const productId = getPremiumProductId();
      if (Platform.OS === 'ios') {
        await iap.requestPurchase({ request: { apple: { sku: productId } }, type: 'in-app' });
      } else {
        await iap.requestPurchase({ request: { google: { skus: [productId] } }, type: 'in-app' });
      }
    } catch (err) {
      console.warn('[IAP] requestPurchase error:', err);
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const iap = await import('react-native-iap');
      const purchases = await iap.getAvailablePurchases();
      const productId = getPremiumProductId();
      if (purchases.some((p) => p.productId === productId)) {
        await markPremium();
      }
    } catch (err) {
      console.warn('[IAP] restorePurchases error:', err);
    } finally {
      setIsPurchasing(false);
    }
  }, [markPremium]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        isPurchasing,
        products,
        purchasePremium,
        restorePurchases,
        FREE_ACCOUNT_LIMIT,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

// ─── Exported provider — picks the right implementation ──────────────────────
export function PremiumProvider({ children }: { children: React.ReactNode }) {
  if (IS_EXPO_GO) {
    return <ExpoGoProvider>{children}</ExpoGoProvider>;
  }
  return <NativeIAPProvider>{children}</NativeIAPProvider>;
}
