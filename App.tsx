import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Navigation } from '@/navigation';

// Feature #11 — force Hebrew RTL layout for the whole app.
// (In a bare/production build this should run before first render; here we set
// it as early as possible. A one-time reload may be needed on first install to
// fully apply native RTL — Expo handles this via `expo start`.)
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function App() {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Navigation />
    </SafeAreaProvider>
  );
}
