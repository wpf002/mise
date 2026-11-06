import { CATEGORY_LABEL, entriesIn, entryById } from '@mise/engine';
import type { CategoryId } from '@mise/schema';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { haptic } from '../../lib/haptics';
import { categoryColor, font, radius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export const BOWL_SIZE = 148;
const SHUFFLE_MS = 70;
const SPIN_MS = 900;
const STAGGER_MS = 140;

interface Props {
  category: CategoryId;
  entryId: string | null;
  locked: boolean;
  spinning: boolean;
  index: number;
  onToggleLock: () => void;
  onReroll: () => void;
}

/**
 * A prep bowl seen from above. While spinning it shakes and flips through
 * random glyphs from its category, then the real pick drops in with a thud.
 */
export function PrepBowl({ category, entryId, locked, spinning, index, onToggleLock, onReroll }: Props) {
  const t = useTheme();
  const tint = categoryColor[category];
  const entry = entryId ? entryById(entryId) : undefined;
  const [shown, setShown] = useState(entry);
  const [reduceMotion, setReduceMotion] = useState(false);
  const shake = useSharedValue(0);
  const drop = useSharedValue(0);
  const scale = useSharedValue(1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!spinning || locked) {
      setShown(entry);
      return;
    }
    if (reduceMotion) {
      setShown(entry);
      haptic.thud();
      return;
    }
    const pool = entriesIn(category);
    const delay = index * STAGGER_MS;
    const stop = delay + SPIN_MS;
    shake.value = withDelay(delay, withRepeat(withSequence(withTiming(-6, { duration: 60 }), withTiming(6, { duration: 60 })), Math.floor(SPIN_MS / 120), true, () => { shake.value = 0; }));
    timer.current = setInterval(() => setShown(pool[Math.floor(Math.random() * pool.length)]), SHUFFLE_MS);
    const settle = setTimeout(() => {
      if (timer.current) clearInterval(timer.current);
      setShown(entry);
      drop.value = -40;
      drop.value = withSpring(0, { damping: 9, stiffness: 180 });
      scale.value = withSequence(withTiming(1.12, { duration: 120, easing: Easing.out(Easing.quad) }), withSpring(1, { damping: 10 }));
      haptic.thud();
    }, stop);
    return () => {
      if (timer.current) clearInterval(timer.current);
      clearTimeout(settle);
    };
  }, [spinning, entryId, locked, reduceMotion]);

  const bowlStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { scale: scale.value }] }));
  const glyphStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drop.value }] }));

  return (
    <View style={{ width: BOWL_SIZE, alignItems: 'center', gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${CATEGORY_LABEL[category]}: ${shown?.label ?? 'empty'}. ${locked ? 'Locked' : 'Tap to reroll, hold to lock'}`}
        onPress={() => { if (!locked && !spinning) onReroll(); }}
        onLongPress={() => { haptic.success(); onToggleLock(); }}
        delayLongPress={300}
      >
        <Animated.View style={[{ width: BOWL_SIZE, height: BOWL_SIZE, borderRadius: BOWL_SIZE / 2, backgroundColor: t.surface, borderWidth: 5, borderColor: locked ? t.accent : tint, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }, bowlStyle]}>
          <View style={{ position: 'absolute', width: BOWL_SIZE - 28, height: BOWL_SIZE - 28, borderRadius: (BOWL_SIZE - 28) / 2, backgroundColor: t.raised, opacity: 0.6 }} />
          <Animated.Text style={[{ fontSize: 62, lineHeight: 74 }, glyphStyle]}>{shown?.emoji ?? '·'}</Animated.Text>
          {locked ? (
            <View style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="lock-closed" size={14} color={t.bg} />
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: tint }}>{CATEGORY_LABEL[category]}</Text>
      <Text numberOfLines={2} style={{ fontFamily: font.display, fontSize: 18, lineHeight: 22, color: t.text, textAlign: 'center', minHeight: 44 }}>
        {shown?.label ?? '—'}
      </Text>
      <View style={{ height: 6, width: 36, borderRadius: radius.pill, backgroundColor: locked ? t.accent : 'transparent' }} />
    </View>
  );
}

export const SPIN_TOTAL_MS = (count: number) => SPIN_MS + STAGGER_MS * Math.max(0, count - 1) + 200;
