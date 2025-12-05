import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

// This tab redirects to the market screen
export default function DocumentScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(market)/market_screen');
  }, []);

  return null;
}

