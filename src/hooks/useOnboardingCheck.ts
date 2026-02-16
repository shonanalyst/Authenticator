import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export function useOnboardingCheck() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setHasSeenOnboarding(value === 'true');
      setIsCheckingOnboarding(false);
    });
  }, []);

  const markOnboardingSeen = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }, []);

  return { hasSeenOnboarding, isCheckingOnboarding, markOnboardingSeen };
}
