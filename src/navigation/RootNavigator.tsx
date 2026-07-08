// ============================================================================
// Root stack navigator — onboarding, the main tabs, and all modal/full-screen
// routes presented over them.
// ============================================================================

import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { KEYS, getBool } from '../storage/storage';

import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import QuestDetailScreen from '../screens/QuestDetailScreen';
import QuestLogScreen from '../screens/QuestLogScreen';
import BossWheelScreen from '../screens/BossWheelScreen';
import ChaosRandomizerScreen from '../screens/ChaosRandomizerScreen';
import AddCharacterScreen from '../screens/AddCharacterScreen';
import CustomizePlayerScreen from '../screens/CustomizePlayerScreen';
import CharacterDetailScreen from '../screens/CharacterDetailScreen';
import ArchiveEntryScreen from '../screens/ArchiveEntryScreen';
import CreateQuestScreen from '../screens/CreateQuestScreen';
import CreatePlaceScreen from '../screens/CreatePlaceScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import CharacterCodexScreen from '../screens/CharacterCodexScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const onboardingDone = getBool(KEYS.ONBOARDING_DONE, false);

  return (
    <Stack.Navigator
      initialRouteName={onboardingDone ? 'MainTabs' : 'Onboarding'}
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0f0f1a' } }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Modal-presented routes */}
      <Stack.Group screenOptions={{ ...TransitionPresets.ModalSlideFromBottomIOS, presentation: 'modal' }}>
        <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
        <Stack.Screen name="QuestLog" component={QuestLogScreen} />
        <Stack.Screen name="AddCharacter" component={AddCharacterScreen} />
        <Stack.Screen name="CustomizePlayer" component={CustomizePlayerScreen} />
        <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
        <Stack.Screen name="ArchiveEntry" component={ArchiveEntryScreen} />
        <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
        <Stack.Screen name="CreatePlace" component={CreatePlaceScreen} />
        <Stack.Screen name="Archive" component={ArchiveScreen} />
        <Stack.Screen name="Codex" component={CharacterCodexScreen} />
      </Stack.Group>

      {/* Full-screen, non-dismissable region-entry sequence */}
      <Stack.Group screenOptions={{ gestureEnabled: false, presentation: 'card' }}>
        <Stack.Screen name="BossWheel" component={BossWheelScreen} />
        <Stack.Screen name="ChaosRandomizer" component={ChaosRandomizerScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
