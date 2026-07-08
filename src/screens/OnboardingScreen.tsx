// ============================================================================
// OnboardingScreen — the cinematic first-run sequence. Ten guided, step-by-step
// screens that introduce the world, name the player, and teach every system a
// new traveler will meet (quests, the map, Odyssey vs Exploration, the spin,
// the Dex, the Archive, custom places + characters) before launching them into
// Odyssey Mode to choose their starting country + region.
//
// Each step has its own pixel illustration / UI preview, a progress indicator,
// and a single forward CTA. The final CTA sets the name, locks in Odyssey Mode,
// and resets into the Map (world view) — where the player picks where to begin.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { COLORS, SIZES } from '../utils/constants';
import { KEYS, setBool } from '../storage/storage';
import { useAppNavigation } from '../navigation/hooks';
import { useGameStore } from '../store/useGameStore';
import { COUNTRIES } from '../utils/countries';

import { PixelText } from '../components/ui/PixelText';
import { PixelButton } from '../components/ui/PixelButton';
import { PlayerSprite } from '../components/map/PlayerSprite';
import { RegionBadgeJigsaw } from '../components/ui/RegionBadgeJigsaw';
import { WorldMap } from '../components/map/WorldMap';
import type { CharacterAppearance } from '../types';

/** Live stage width — capped so the illustration stays tight on big screens.
 *  Uses a live dimension (NOT a module-load constant, which is 0 on web). */
function useStageW(): number {
  const { width } = useWindowDimensions();
  return Math.min((width || 390) - SIZES.spacingLg * 2, 460);
}

// ---- Welcome: a lone traveler on a pixel horizon under a rising sun. -------
const WelcomeVisual: React.FC<{ appearance?: CharacterAppearance }> = ({ appearance }) => {
  const w = useStageW();
  const h = 232;
  return (
    <View style={{ width: w, height: h, marginBottom: SIZES.spacingLg, borderWidth: SIZES.borderWidth + 1, borderColor: COLORS.GOLD, overflow: 'hidden' }}>
      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill="#1a1430" />
        <Rect x={0} y={150} width={w} height={h - 150} fill="#241a3e" />
        <Circle cx={w / 2} cy={88} r={46} fill={COLORS.GOLD} opacity={0.16} />
        <Circle cx={w / 2} cy={88} r={32} fill={COLORS.GOLD} opacity={0.92} />
        <Polygon points={`0,150 ${w * 0.28},78 ${w * 0.56},150`} fill="#2e2350" />
        <Polygon points={`${w * 0.42},150 ${w * 0.72},92 ${w},150`} fill="#382a60" />
        <Rect x={0} y={150} width={w} height={3} fill={COLORS.PURPLE} opacity={0.5} />
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <PlayerSprite x={w / 2} y={176} size={56} appearance={appearance} />
      </View>
    </View>
  );
};

// ---- Name: a nameplate that previews the player's chosen name. -------------
const NameVisual: React.FC<{ name: string; appearance?: CharacterAppearance }> = ({ name, appearance }) => (
  <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
    <View style={{ width: 92, height: 96 }}>
      <PlayerSprite x={46} y={50} size={64} appearance={appearance} />
    </View>
    <View
      style={{
        marginTop: SIZES.spacingMd,
        minWidth: 180,
        borderWidth: SIZES.borderWidth,
        borderColor: COLORS.GOLD,
        backgroundColor: COLORS.BG_CARD,
        paddingVertical: SIZES.spacingSm,
        paddingHorizontal: SIZES.spacingLg,
        alignItems: 'center',
      }}
    >
      <PixelText size={6} color={COLORS.TEXT_DISABLED}>TRAVELER</PixelText>
      <PixelText size={14} color={COLORS.GOLD} align="center" style={{ marginTop: 6 }}>
        {name.trim() ? name.trim().toUpperCase() : '. . .'}
      </PixelText>
    </View>
  </View>
);

// ---- Quest: the four quest types as a legend. ------------------------------
const QUEST_LEGEND = [
  { g: '?', c: COLORS.BLUE, t: 'STANDARD', d: 'pick & complete' },
  { g: '%', c: COLORS.RED, t: 'CHAOS', d: 'spun at each stop' },
  { g: '#', c: COLORS.QUEST_BOSS, t: 'BOSS', d: 'one per region' },
  { g: '+', c: COLORS.GREEN, t: 'CUSTOM', d: 'write your own' },
];
const QuestVisual: React.FC = () => {
  const w = useStageW();
  return (
    <View style={{ width: w, paddingHorizontal: SIZES.spacingLg, paddingVertical: SIZES.spacingMd, marginBottom: SIZES.spacingLg, borderWidth: SIZES.borderWidth + 1, borderColor: COLORS.BLUE, backgroundColor: COLORS.BG_SURFACE }}>
      {QUEST_LEGEND.map((q) => (
        <View key={q.t} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderWidth: SIZES.borderWidth,
              borderColor: q.c,
              backgroundColor: COLORS.BG_CARD,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: SIZES.spacingMd,
            }}
          >
            <PixelText size={18} color={q.c}>{q.g}</PixelText>
          </View>
          <View>
            <PixelText size={10} color={q.c}>{q.t}</PixelText>
            <PixelText size={7} color={COLORS.TEXT_SECONDARY} style={{ marginTop: 3 }}>{q.d}</PixelText>
          </View>
        </View>
      ))}
    </View>
  );
};

// ---- Map: a live preview of the world board. -------------------------------
const MapVisual: React.FC = () => {
  const w = useStageW();
  return (
    <View pointerEvents="none" style={{ width: Math.min(w * 0.66, 300), marginBottom: SIZES.spacingLg }}>
      <WorldMap countries={COUNTRIES} onPressCountry={() => {}} />
    </View>
  );
};

// ---- Odyssey vs Exploration: locked chain vs open field. -------------------
const MiniTile: React.FC<{ label: string; color: string; locked?: boolean }> = ({ label, color, locked }) => (
  <View
    style={{
      width: 52,
      height: 30,
      margin: 3,
      borderWidth: SIZES.borderWidth,
      borderColor: locked ? COLORS.TEXT_DISABLED : color,
      backgroundColor: locked ? COLORS.BG_SURFACE : COLORS.BG_CARD,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {locked ? <PixelText size={11}>🔒</PixelText> : <PixelText size={7} color={color}>{label}</PixelText>}
  </View>
);
const ModeVisual: React.FC = () => {
  const w = useStageW();
  return (
    <View style={{ flexDirection: 'row', width: w, justifyContent: 'space-around', marginBottom: SIZES.spacingLg, paddingVertical: SIZES.spacingMd, borderWidth: SIZES.borderWidth + 1, borderColor: COLORS.PURPLE, backgroundColor: COLORS.BG_SURFACE }}>
      <View style={{ alignItems: 'center' }}>
        <PixelText size={8} color={COLORS.GOLD} style={{ marginBottom: SIZES.spacingSm }}>ODYSSEY</PixelText>
        <MiniTile label="R1" color={COLORS.GOLD} />
        <MiniTile label="R2" color={COLORS.GOLD} locked />
        <MiniTile label="R3" color={COLORS.GOLD} locked />
        <MiniTile label="R4" color={COLORS.GOLD} locked />
      </View>
      <View style={{ width: SIZES.borderWidth, backgroundColor: COLORS.BG_BORDER, marginHorizontal: SIZES.spacingMd }} />
      <View style={{ alignItems: 'center' }}>
        <PixelText size={8} color={COLORS.TEAL} style={{ marginBottom: SIZES.spacingSm }}>EXPLORATION</PixelText>
        <View style={{ flexDirection: 'row' }}>
          <MiniTile label="R1" color={COLORS.TEAL} />
          <MiniTile label="R2" color={COLORS.TEAL} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <MiniTile label="R3" color={COLORS.TEAL} />
          <MiniTile label="R4" color={COLORS.TEAL} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <MiniTile label="R5" color={COLORS.TEAL} />
          <MiniTile label="R6" color={COLORS.TEAL} />
        </View>
      </View>
    </View>
  );
};

// ---- Spin: a chaos/boss prize wheel with a pointer. ------------------------
function pt(cx: number, cy: number, deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
}
function wedge(cx: number, cy: number, a: number, b: number, r: number) {
  return `M ${cx} ${cy} L ${pt(cx, cy, a, r)} A ${r} ${r} 0 0 1 ${pt(cx, cy, b, r)} Z`;
}
const WHEEL_COLORS = [COLORS.GOLD, COLORS.RED, COLORS.BLUE, COLORS.PURPLE, COLORS.GREEN, COLORS.ORANGE, COLORS.TEAL, COLORS.QUEST_BOSS];
const SpinVisual: React.FC = () => {
  const S = 168;
  const c = S / 2;
  const r = c - 8;
  return (
    <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
      <Svg width={S} height={S}>
        {WHEEL_COLORS.map((col, i) => (
          <Path key={i} d={wedge(c, c, i * 45, (i + 1) * 45, r)} fill={col} opacity={0.85} stroke={COLORS.BG_DARK} strokeWidth={2} />
        ))}
        <Circle cx={c} cy={c} r={16} fill={COLORS.BG_DARK} stroke={COLORS.GOLD} strokeWidth={3} />
        <Polygon points={`${c - 10},2 ${c + 10},2 ${c},22`} fill={COLORS.GOLD} stroke={COLORS.BG_DARK} strokeWidth={1} />
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: SIZES.spacingMd }}>
        <View style={{ borderWidth: SIZES.borderWidth, borderColor: COLORS.RED, paddingHorizontal: SIZES.spacingSm, paddingVertical: 4, marginRight: SIZES.spacingSm }}>
          <PixelText size={7} color={COLORS.RED}>CHAOS x3</PixelText>
        </View>
        <View style={{ borderWidth: SIZES.borderWidth, borderColor: COLORS.QUEST_BOSS, paddingHorizontal: SIZES.spacingSm, paddingVertical: 4 }}>
          <PixelText size={7} color={COLORS.QUEST_BOSS}># BOSS QUEST</PixelText>
        </View>
      </View>
    </View>
  );
};

// ---- Dex: stats, a region badge, a collectible card. -----------------------
const StatChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={{ borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER, backgroundColor: COLORS.BG_CARD, paddingHorizontal: SIZES.spacingSm, paddingVertical: 6, margin: 3, alignItems: 'center', minWidth: 64 }}>
    <PixelText size={11} color={color}>{value}</PixelText>
    <PixelText size={5} color={COLORS.TEXT_DISABLED} style={{ marginTop: 3 }}>{label}</PixelText>
  </View>
);
const DexVisual: React.FC = () => (
  <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: SIZES.spacingSm }}>
      <StatChip label="LEVEL" value="7" color={COLORS.GOLD} />
      <StatChip label="XP" value="12,400" color={COLORS.BLUE} />
      <StatChip label="TEMPLES" value="37" color={COLORS.RED} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <RegionBadgeJigsaw region="Northern Thailand" cities={['A', 'B', 'C', 'D']} medaledCities={['A', 'B', 'C']} accent={COLORS.GOLD} size={66} />
      <View style={{ width: 56, height: 78, marginLeft: SIZES.spacingMd, borderWidth: SIZES.borderWidth, borderColor: COLORS.GOLD, backgroundColor: '#3a2e0c', alignItems: 'center', justifyContent: 'center' }}>
        <PixelText size={20}>🏆</PixelText>
        <PixelText size={5} color={COLORS.GOLD} style={{ marginTop: 4 }}>CARD</PixelText>
      </View>
    </View>
  </View>
);

// ---- Archive: a polaroid + a strip of logged memories. ---------------------
const ArchiveVisual: React.FC = () => (
  <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
    <View style={{ backgroundColor: '#e8e8f0', padding: 8, paddingBottom: 22, borderWidth: SIZES.borderWidth, borderColor: COLORS.BG_BORDER }}>
      <View style={{ width: 132, height: 92, backgroundColor: '#2e4a5c', alignItems: 'center', justifyContent: 'center' }}>
        <PixelText size={34}>📷</PixelText>
      </View>
    </View>
    <View style={{ flexDirection: 'row', marginTop: SIZES.spacingMd }}>
      {['🏯', '🍜', '🏝️', '🛶'].map((e, i) => (
        <View key={i} style={{ width: 34, height: 34, borderWidth: SIZES.borderWidth, borderColor: COLORS.PURPLE, backgroundColor: COLORS.BG_CARD, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 }}>
          <PixelText size={16}>{e}</PixelText>
        </View>
      ))}
    </View>
  </View>
);

// ---- Custom places + characters: a saved pin and a tagged friend. ----------
const CustomVisual: React.FC<{ appearance?: CharacterAppearance }> = ({ appearance }) => {
  const w = useStageW();
  return (
    <View style={{ flexDirection: 'row', width: w, justifyContent: 'space-around', alignItems: 'center', marginBottom: SIZES.spacingLg }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 78, height: 78, borderWidth: SIZES.borderWidth, borderColor: COLORS.GREEN, backgroundColor: '#143a22', alignItems: 'center', justifyContent: 'center' }}>
          <PixelText size={34}>📍</PixelText>
        </View>
        <View style={{ marginTop: SIZES.spacingSm, borderWidth: SIZES.borderWidth, borderColor: COLORS.GREEN, paddingHorizontal: SIZES.spacingSm, paddingVertical: 3 }}>
          <PixelText size={7} color={COLORS.GREEN}>+ NEW PLACE</PixelText>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 78, height: 78 }}>
          <PlayerSprite x={39} y={40} size={52} appearance={appearance} animated={false} />
        </View>
        <View style={{ marginTop: SIZES.spacingSm, borderWidth: SIZES.borderWidth, borderColor: COLORS.TEAL, paddingHorizontal: SIZES.spacingSm, paddingVertical: 3 }}>
          <PixelText size={7} color={COLORS.TEAL}>+ TAG A FRIEND</PixelText>
        </View>
      </View>
    </View>
  );
};

// ---- Ready: the named traveler, ready to launch. ---------------------------
const ReadyVisual: React.FC<{ name: string; appearance?: CharacterAppearance }> = ({ name, appearance }) => (
  <View style={{ alignItems: 'center', marginBottom: SIZES.spacingLg }}>
    <View style={{ width: 110, height: 116 }}>
      <PlayerSprite x={55} y={60} size={78} appearance={appearance} />
    </View>
    <View style={{ marginTop: SIZES.spacingMd, borderWidth: SIZES.borderWidth + 1, borderColor: COLORS.GOLD, backgroundColor: COLORS.BG_CARD, paddingVertical: SIZES.spacingSm, paddingHorizontal: SIZES.spacingXl }}>
      <PixelText size={16} color={COLORS.GOLD} align="center">{(name.trim() || 'Traveler').toUpperCase()}</PixelText>
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Step content
// ---------------------------------------------------------------------------
interface Step {
  key: string;
  title: string;
  accent: string;
  body: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    key: 'welcome',
    title: 'ODYSSEY TRAVELER',
    accent: COLORS.GOLD,
    body: 'This is a real-world RPG, and the board is the planet you already live on. Where you go, what you eat, who you meet, the risks you take — it all earns XP. Real life is the game.',
    cta: 'BEGIN',
  },
  {
    key: 'name',
    title: 'NAME YOUR TRAVELER',
    accent: COLORS.GOLD,
    body: 'Every legend needs a name. This is who you’ll be across the whole journey, so make it yours.',
    cta: 'CONTINUE',
  },
  {
    key: 'quest',
    title: 'WHAT IS A QUEST?',
    accent: COLORS.BLUE,
    body: 'Quests are the real things you do out there — temples, markets, street food, islands, hikes. Completing them earns XP. They come in four kinds: standard, Chaos (wildcards you spin for), Boss (one per region), and Custom (ones you write yourself).',
    cta: 'NEXT',
  },
  {
    key: 'map',
    title: 'THE MAP',
    accent: COLORS.TEAL,
    body: 'The map is how you move: countries open into regions, regions into cities, cities into quests. In Odyssey Mode each region stays locked until you’ve earned the XP to reach it. Tap from the whole world down to a single street stall.',
    cta: 'NEXT',
  },
  {
    key: 'mode',
    title: 'ODYSSEY vs EXPLORATION',
    accent: COLORS.PURPLE,
    body: 'Odyssey Mode is the real game — start in one region and earn XP across four levels to unlock the next, one frontier at a time. Exploration Mode lets you roam every quest in every region freely. You’re starting in Odyssey.',
    cta: 'NEXT',
  },
  {
    key: 'spin',
    title: 'THE SPIN',
    accent: COLORS.RED,
    body: 'At every location you spin to learn how many Chaos Quests you owe that place. The same spin hands you your Boss Quest — one per region, free of charge. Boss challenges are the hard ones, and they pay the most.',
    cta: 'NEXT',
  },
  {
    key: 'dex',
    title: 'THE DEX',
    accent: COLORS.GOLD,
    body: 'The Dex is your travel record: live stats, temple counts, collectible cards from finished quests, and milestone medals. It ranks your temples — a global top 10 and a top 5 per region. Every character you meet and tag lives here too.',
    cta: 'NEXT',
  },
  {
    key: 'archive',
    title: 'THE ARCHIVE',
    accent: COLORS.PURPLE,
    body: 'Every quest you finish can hold your own photos, video, and notes. Together they become a personal travel documentary, built one memory at a time. The Archive is where your odyssey is remembered.',
    cta: 'NEXT',
  },
  {
    key: 'custom',
    title: 'MAKE IT YOURS',
    accent: COLORS.GREEN,
    body: 'Found a spot the map doesn’t know — a backstreet noodle shop, a hidden trail, a temple off the grid? Save it as your own place. Meet someone worth remembering? Tag them to where you met, and they join your world.',
    cta: 'NEXT',
  },
  {
    key: 'ready',
    title: 'YOU’RE READY',
    accent: COLORS.GOLD,
    body: 'The world map is open and nothing’s been decided yet. Choose your country and the region where your odyssey begins — everything after that, you earn.',
    cta: 'BEGIN YOUR ODYSSEY',
  },
];

export default function OnboardingScreen() {
  const navigation = useAppNavigation();
  const appearance = useGameStore((s) => s.player.appearance);
  const stageW = useStageW();

  const [index, setIndex] = useState(0);
  const [name, setName] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const step = STEPS[index];
  const isName = step.key === 'name';
  const canAdvance = !isName || name.trim().length > 0;

  // Cinematic per-step transition: fade + rise.
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = 0;
    anim.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index, anim]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ translateY: (1 - anim.value) * 18 }],
  }));

  const finish = () => {
    const finalName = name.trim() || 'Traveler';
    const g = useGameStore.getState();
    g.setPlayerName(finalName);
    g.setGameMode('odyssey'); // land directly in Odyssey Mode
    setBool(KEYS.ONBOARDING_DONE, true);
    // Reset into the tabs — Map is the initial tab, so the player lands on the
    // world view to choose their starting country + region (Odyssey, Region 1).
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const next = () => {
    if (!canAdvance) return;
    if (index >= STEPS.length - 1) return finish();
    setIndex(index + 1);
  };
  const back = () => {
    if (index > 0) setIndex(index - 1);
  };

  const renderVisual = () => {
    switch (step.key) {
      case 'welcome': return <WelcomeVisual appearance={appearance} />;
      case 'name': return <NameVisual name={name} appearance={appearance} />;
      case 'quest': return <QuestVisual />;
      case 'map': return <MapVisual />;
      case 'mode': return <ModeVisual />;
      case 'spin': return <SpinVisual />;
      case 'dex': return <DexVisual />;
      case 'archive': return <ArchiveVisual />;
      case 'custom': return <CustomVisual appearance={appearance} />;
      case 'ready': return <ReadyVisual name={name} appearance={appearance} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BG_DARK }}>
      {/* Top bar — back chevron + progress + skip. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.spacingMd, paddingTop: SIZES.spacingSm }}>
        {index > 0 ? (
          <PixelButton label="<" size="sm" variant="outline" color={COLORS.TEXT_SECONDARY} onPress={back} />
        ) : (
          <View style={{ width: 28 }} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <PixelText size={7} color={COLORS.TEXT_SECONDARY}>{`STEP ${index + 1} / ${STEPS.length}`}</PixelText>
        </View>
        {index < STEPS.length - 1 ? (
          <PixelButton label="SKIP" size="sm" variant="outline" color={COLORS.TEXT_DISABLED} onPress={finish} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Segmented progress bar. */}
      <View style={{ flexDirection: 'row', paddingHorizontal: SIZES.spacingMd, marginTop: SIZES.spacingSm }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              marginHorizontal: 2,
              backgroundColor: i <= index ? step.accent : COLORS.BG_BORDER,
            }}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SIZES.spacingLg, paddingVertical: SIZES.spacingLg }}
      >
        <Animated.View style={[{ alignItems: 'center', width: '100%' }, animStyle]}>
          {renderVisual()}

          <PixelText size={16} color={step.accent} align="center" style={{ marginBottom: SIZES.spacingMd }}>
            {step.title}
          </PixelText>
          <PixelText size={11} variant="body" color={COLORS.TEXT_SECONDARY} align="center" lineHeight={19} style={{ maxWidth: stageW }}>
            {step.body}
          </PixelText>

          {isName ? (
            <TextInput
              value={name}
              onChangeText={(t) => setName(t.slice(0, 20))}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.TEXT_DISABLED}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={next}
              maxLength={20}
              style={{
                marginTop: SIZES.spacingLg,
                width: stageW,
                borderWidth: SIZES.borderWidth,
                borderColor: COLORS.GOLD,
                backgroundColor: COLORS.BG_SURFACE,
                color: COLORS.TEXT_PRIMARY,
                fontFamily: 'PressStart2P_400Regular',
                fontSize: 12,
                paddingVertical: SIZES.spacingMd,
                paddingHorizontal: SIZES.spacingMd,
                textAlign: 'center',
              }}
            />
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={{ padding: SIZES.spacingLg }}>
        <PixelButton
          label={step.cta}
          color={step.accent}
          size="lg"
          fullWidth
          disabled={!canAdvance}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}
