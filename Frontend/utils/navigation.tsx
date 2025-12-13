import { useRouter } from 'expo-router';

/**
 * Safely navigate back. If there's no screen to go back to, 
 * it will navigate to the home screen instead.
 */
export const safeGoBack = (router: ReturnType<typeof useRouter>, fallbackRoute: string = '/(tabs)/home') => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
};


