// ============================================================================
// Bottom tab navigator — MAP · TODAY · DEX
// ============================================================================

import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types';
import { COLORS, FONT, SIZES } from '../utils/constants';

import MapScreen from '../screens/MapScreen';
import TodayScreen from '../screens/TodayScreen';
import TravelerDexScreen from '../screens/TravelerDexScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const LABELS: Record<keyof MainTabParamList, string> = {
  Map: 'MAP',
  Today: 'TODAY',
  TravelerDex: 'DEX',
};

// Emoji tab icons: 🗺️ Map · 🔍 Today · 📚 Dex.
const EMOJI: Record<keyof MainTabParamList, string> = {
  Map: '🗺️',
  Today: '🔍',
  TravelerDex: '📚',
};

function tabIcon(name: keyof MainTabParamList, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', opacity: focused ? 1 : 0.75 }}>
      <Text style={{ fontSize: 20 }}>{EMOJI[name]}</Text>
    </View>
  );
}

function tabLabel(name: keyof MainTabParamList, color: string) {
  return <Text style={{ fontFamily: FONT.pixel, fontSize: 7, color, marginTop: 2 }}>{LABELS[name]}</Text>;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.GOLD,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: COLORS.BG_SURFACE,
          borderTopWidth: SIZES.borderWidth,
          borderTopColor: COLORS.BG_BORDER,
          height: SIZES.tabBarHeight,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused }) => tabIcon(route.name as keyof MainTabParamList, focused),
        tabBarLabel: ({ color }) => tabLabel(route.name as keyof MainTabParamList, color),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="TravelerDex" component={TravelerDexScreen} />
    </Tab.Navigator>
  );
}
