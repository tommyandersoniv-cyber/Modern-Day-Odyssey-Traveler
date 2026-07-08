// ============================================================================
// AppOverlays — global, store-driven feedback layer mounted above the navigator.
// Renders the level-up cutscene, badge-unlock celebration, and floating XP
// popup based on transient signals in useGameStore.
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { LevelUpModal } from './LevelUpModal';
import { BadgeUnlockModal } from './BadgeUnlockModal';
import { MedalUnlockModal } from './MedalUnlockModal';
import { MilestoneUnlockModal } from './MilestoneUnlockModal';
import { RegionUnlockModal } from './RegionUnlockModal';
import { XPPopup } from './XPPopup';

export const AppOverlays: React.FC = () => {
  const pendingLevelUp = useGameStore((s) => s.pendingLevelUp);
  const pendingBadges = useGameStore((s) => s.pendingBadges);
  const pendingMedals = useGameStore((s) => s.pendingMedals);
  const pendingMilestones = useGameStore((s) => s.pendingMilestones);
  const pendingRegionComplete = useGameStore((s) => s.pendingRegionComplete);
  const lastXPGain = useGameStore((s) => s.lastXPGain);
  const consumePendingLevelUp = useGameStore((s) => s.consumePendingLevelUp);
  const consumePendingBadge = useGameStore((s) => s.consumePendingBadge);
  const consumePendingMedal = useGameStore((s) => s.consumePendingMedal);
  const consumePendingMilestone = useGameStore((s) => s.consumePendingMilestone);
  const consumePendingRegionComplete = useGameStore((s) => s.consumePendingRegionComplete);
  const clearLastXPGain = useGameStore((s) => s.clearLastXPGain);

  const medal = pendingMedals.length > 0 ? pendingMedals[0] : null;
  const badge = pendingBadges.length > 0 ? pendingBadges[0] : null;
  const milestone = pendingMilestones.length > 0 ? pendingMilestones[0] : null;

  return (
    <View pointerEvents="box-none" style={{ ...StyleSheetAbsoluteFill }}>
      {lastXPGain ? (
        <XPPopup amount={lastXPGain.amount} sourceKey={lastXPGain.key} onDone={clearLastXPGain} />
      ) : null}

      {/* Level-up takes priority; badges queue behind it. */}
      <LevelUpModal
        visible={!!pendingLevelUp}
        level={pendingLevelUp?.new_level ?? 1}
        title={pendingLevelUp?.title ?? ''}
        onClose={consumePendingLevelUp}
      />

      <MedalUnlockModal
        visible={!pendingLevelUp && !!medal}
        notice={medal}
        onClose={consumePendingMedal}
      />

      <MilestoneUnlockModal
        visible={!pendingLevelUp && !medal && !!milestone}
        notice={milestone}
        onClose={consumePendingMilestone}
      />

      <BadgeUnlockModal
        visible={!pendingLevelUp && !medal && !milestone && !!badge}
        notice={badge}
        onClose={consumePendingBadge}
      />

      <RegionUnlockModal
        visible={!pendingLevelUp && !medal && !milestone && !badge && !!pendingRegionComplete}
        region={pendingRegionComplete}
        onClose={consumePendingRegionComplete}
      />
    </View>
  );
};

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default AppOverlays;
