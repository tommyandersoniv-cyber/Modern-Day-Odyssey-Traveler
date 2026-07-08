// ============================================================================
// LiveClock — an always-running HH:MM:SS military-time readout (00–23 hours).
// Isolated in its own component so the 1-second tick re-renders ONLY this text,
// not the screen hosting it.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { COLORS } from '../../utils/constants';
import { clockTime } from '../../utils/helpers';
import { PixelText } from './PixelText';

export interface LiveClockProps {
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
}

export const LiveClock: React.FC<LiveClockProps> = ({ color = COLORS.LIME, size = 8, align = 'left' }) => {
  const [now, setNow] = useState(() => clockTime());

  useEffect(() => {
    const t = setInterval(() => setNow(clockTime()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <PixelText size={size} color={color} align={align} style={{ marginTop: 4 }}>
      {now}
    </PixelText>
  );
};

export default LiveClock;
