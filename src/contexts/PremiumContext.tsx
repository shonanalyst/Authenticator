import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
  type Product,
} from 'react-native-iap';
import {
  FREE_ACCOUNT_LIMIT,
  PREMIUM_SECURESTORE_KEY,
  getPremiumProductId,
} from '../constants/premium';

interface PremiumContextValue {
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  products: Product[];
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  FREE_ACCOUNT_LIMIT: number;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const purchaseListenerRef = useRef<ReturnType<typeof purchaseUpdatedListener> | null>(null);
  const errorListenerRef = useRef<ReturnType<typeof purchaseErrorListener> | null>(null);

  const markPremium = useCallback(async () => {
    setIsPremium(true);
    await SecureStore.setItemAsync(PREMIUM_SECURESTORE_KEY, 'true');
  }, []);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        // Check cached premium status first for fast startup
        const cached = await SecureStore.getItemAsync(PREMIUM_SECURESTORE_KEY);
        if (cached === 'true' && mounted) {
          setIsPremium(true);
        }

        await initConnection();

        // Verify with store (handles reinstalls, refunds)
        const purchases = await getAvailablePurchases();
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
        const fetchedProducts = await fetchProducts({
          skus: [productId],
          type: 'in-app',
        });
        if (mounted && fetchedProducts) setProducts(fetchedProducts as Product[]);

        // Listen for purchase updates
        purchaseListenerRef.current = purchaseUpdatedListener(
          async (purchase: Purchase) => {
            if (purchase.productId === productId) {
              await finishTransaction({ purchase, isConsumable: false });
              await markPremium();
            }
          }
        );

        errorListenerRef.current = purchaseErrorListener((error) => {
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
      endConnection();
    };
  }, [markPremium]);

  const purchasePremium = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const productId = getPremiumProductId();
      if (Platform.OS === 'ios') {
        await requestPurchase({
          request: { apple: { sku: productId } },
          type: 'in-app',
        });
      } else {
        await requestPurchase({
          request: { google: { skus: [productId] } },
          type: 'in-app',
        });
      }
      // Result handled by purchaseUpdatedListener
    } catch (err) {
      console.warn('[IAP] requestPurchase error:', err);
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsPurchasing(true);
    try {
      const purchases = await getAvailablePurchases();
      const productId = getPremiumProductId();
      const hasPremium = purchases.some((p) => p.productId === productId);
      if (hasPremium) {
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
