import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingFlow } from '../src/screens/OnboardingFlow';

export default function HowItWorksScreen() {
  const router = useRouter();

  return <OnboardingFlow onComplete={() => router.back()} />;
}
