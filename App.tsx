// ============================================================================
// Modern Day Odyssey — app entry. Loads the pixel font, hydrates storage +
// stores, then renders the navigator with the global feedback overlays.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';

import { hydrate as hydrateStorage } from './src/storage/mmkv';
import { bootstrapStores } from './src/store/bootstrap';
import RootNavigator from './src/navigation/RootNavigator';
import { AppOverlays } from './src/components/ui/AppOverlays';
import { LoadingScreen } from './src/components/ui/LoadingScreen';
import { COLORS } from './src/utils/constants';

const navTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.BG_DARK,
    card: COLORS.BG_SURFACE,
    text: COLORS.TEXT_PRIMARY,
    border: COLORS.BG_BORDER,
    primary: COLORS.GOLD,
    notification: COLORS.RED,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await hydrateStorage(); // persisted state (MMKV native, or AsyncStorage fallback)
      bootstrapStores(); // quest data + player/codex/archive + badge recompute
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!fontsLoaded || !ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
        <LoadingScreen message="Loading your odyssey..." />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
          <AppOverlays />
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
