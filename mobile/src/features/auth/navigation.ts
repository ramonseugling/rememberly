import { router } from 'expo-router';

// Returns to the login screen already in the stack instead of stacking another one.
export function backToLogin() {
  if (router.canGoBack()) router.back();
  else router.replace('/login');
}
