// ============================================================================
// RankableList — a manually-ordered list the player controls two ways:
//   • long-press the ⠿ handle and DRAG a row to a new slot
//   • tap the ▲ / ▼ arrows to nudge a row up or down one place
// Rows are a FIXED height so the drag math is a simple round(dy / ROW_H) — no
// per-row measurement, which keeps reordering deterministic.
// ============================================================================

import React, { useRef } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { COLORS, SIZES } from '../../utils/constants';
import { clamp } from '../../utils/helpers';
import { PixelText } from '../ui/PixelText';

export interface RankableItem {
  id: string;
  label: string;
  sublabel?: string;
}

export interface RankableListProps {
  items: RankableItem[]; // already in ranked order
  onReorder: (orderedIds: string[]) => void;
  onRemove?: (id: string) => void;
  accent?: string;
}

const ROW_H = 60;

// ---- A single draggable row -------------------------------------------------
interface RowProps {
  item: RankableItem;
  index: number;
  total: number;
  accent: string;
  dragging: boolean;
  dragY: number;
  onLift: (id: string) => void;
  onDrag: (dy: number) => void;
  onDrop: (id: string, dy: number) => void;
  onUp: (index: number) => void;
  onDown: (index: number) => void;
  onRemove?: (id: string) => void;
}

const Row: React.FC<RowProps> = ({
  item, index, total, accent, dragging, dragY,
  onLift, onDrag, onDrop, onUp, onDown, onRemove,
}) => {
  // Refs keep the PanResponder (created once) reading the latest values.
  const idRef = useRef(item.id);
  idRef.current = item.id;
  const cbRef = useRef({ onLift, onDrag, onDrop });
  cbRef.current = { onLift, onDrag, onDrop };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => cbRef.current.onLift(idRef.current),
      onPanResponderMove: (_e, g) => cbRef.current.onDrag(g.dy),
      onPanResponderRelease: (_e, g) => cbRef.current.onDrop(idRef.current, g.dy),
      onPanResponderTerminate: (_e, g) => cbRef.current.onDrop(idRef.current, g.dy),
    }),
  ).current;

  return (
    <View
      style={{
        height: ROW_H,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: dragging ? COLORS.BG_SURFACE : COLORS.BG_CARD,
        borderWidth: SIZES.borderWidth,
        borderColor: dragging ? accent : COLORS.BG_BORDER,
        borderRadius: SIZES.borderRadius,
        marginBottom: SIZES.spacingSm,
        paddingHorizontal: SIZES.spacingSm,
        transform: dragging ? [{ translateY: dragY }] : undefined,
        zIndex: dragging ? 20 : 1,
        opacity: dragging ? 0.95 : 1,
      }}
    >
      {/* Rank number */}
      <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: accent, borderRadius: SIZES.borderRadius, marginRight: SIZES.spacingSm }}>
        <PixelText size={10} color={COLORS.BG_DARK}>{String(index + 1)}</PixelText>
      </View>

      {/* Label + location */}
      <View style={{ flex: 1, marginRight: SIZES.spacingSm }}>
        <PixelText size={8} color={COLORS.TEXT_PRIMARY} numberOfLines={1}>{item.label}</PixelText>
        {item.sublabel ? (
          <PixelText size={6} color={COLORS.TEXT_SECONDARY} numberOfLines={1} style={{ marginTop: 3 }}>{item.sublabel}</PixelText>
        ) : null}
      </View>

      {/* Up / down arrows */}
      <Pressable onPress={() => onUp(index)} disabled={index === 0} hitSlop={6} style={{ paddingHorizontal: 5, opacity: index === 0 ? 0.3 : 1 }}>
        <PixelText size={12} color={accent}>▲</PixelText>
      </Pressable>
      <Pressable onPress={() => onDown(index)} disabled={index === total - 1} hitSlop={6} style={{ paddingHorizontal: 5, opacity: index === total - 1 ? 0.3 : 1 }}>
        <PixelText size={12} color={accent}>▼</PixelText>
      </Pressable>

      {/* Drag handle */}
      <View {...responder.panHandlers} hitSlop={8} style={{ paddingHorizontal: 6 }}>
        <PixelText size={14} color={COLORS.TEXT_SECONDARY}>⠿</PixelText>
      </View>

      {/* Remove */}
      {onRemove ? (
        <Pressable onPress={() => onRemove(item.id)} hitSlop={8} style={{ paddingLeft: 6 }}>
          <PixelText size={12} color={COLORS.RED}>✕</PixelText>
        </Pressable>
      ) : null}
    </View>
  );
};

export const RankableList: React.FC<RankableListProps> = ({ items, onReorder, onRemove, accent = COLORS.GOLD }) => {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragY, setDragY] = React.useState(0);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map((i) => i.id));
  };

  const onDrop = (id: string, dy: number) => {
    const from = items.findIndex((i) => i.id === id);
    setDragId(null);
    setDragY(0);
    if (from < 0) return;
    const to = clamp(from + Math.round(dy / (ROW_H + SIZES.spacingSm)), 0, items.length - 1);
    move(from, to);
  };

  return (
    <View>
      {items.map((item, index) => (
        <Row
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          accent={accent}
          dragging={dragId === item.id}
          dragY={dragY}
          onLift={(id) => { setDragId(id); setDragY(0); }}
          onDrag={setDragY}
          onDrop={onDrop}
          onUp={(i) => move(i, i - 1)}
          onDown={(i) => move(i, i + 1)}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
};

export default RankableList;
