// ============================================================================
// Shared, typed navigation hooks. Every screen uses useAppNavigation() so the
// param list stays consistent across the whole app.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';

export type AppNav = StackNavigationProp<RootStackParamList>;

export function useAppNavigation(): AppNav {
  return useNavigation<AppNav>();
}

/**
 * Run `reset` whenever this tab's button is pressed — so tapping a tab returns
 * to that tab's starting screen instead of wherever it was drilled into.
 * The latest `reset` is held in a ref so we only subscribe once.
 */
export function useTabPressReset(reset: () => void): void {
  const navigation = useNavigation();
  const ref = useRef(reset);
  ref.current = reset;
  useEffect(() => {
    const unsub = navigation.addListener('tabPress' as never, () => ref.current());
    return unsub;
  }, [navigation]);
}
