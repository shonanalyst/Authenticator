import React, { useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { OnboardingFlow } from '../src/screens/OnboardingFlow';

export default function HowItWorksScreen() {
  const router = useRouter();
  const [key, setKey] = useState(0);

  // Every time this screen comes into focus, remount OnboardingFlow from page 1
  useFocusEffect(
    useCallback(() => {
      setKey(k => k + 1);
    }, [])
  );

  return <OnboardingFlow key={key} onComplete={() => router.back()} />;
}
