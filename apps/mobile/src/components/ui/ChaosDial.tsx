import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '../../lib/haptics';
import { font, radius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Label } from './index';

const TRACK_HEIGHT = 56;
const KNOB = 44;
const STOPS = ['Tame', 'Mild', 'Lively', 'Wild', 'Chaos'] as const;

function stopFor(value: number): string {
  return STOPS[Math.min(STOPS.length - 1, Math.floor(value * STOPS.length))] ?? 'Mild';
}

/** Chaos slider: how weird a spin is allowed to be. Drag or tap anywhere on the track. */
export function ChaosDial({ value, onChange, width }: { value: number; onChange: (value: number) => void; width: number }) {
  const t = useTheme();
  const usable = width - KNOB;
  const x = useSharedValue(value * usable);
  const startX = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(value * usable, { damping: 18 });
  }, [value, usable, x]);

  const commit = (px: number) => {
    const next = Math.round((Math.min(usable, Math.max(0, px)) / usable) * 20) / 20;
    if (next !== value) {
      haptic.tick();
      onChange(next);
    }
  };

  const pan = Gesture.Pan()
    .onStart(() => { startX.value = x.value; })
    .onUpdate((event) => { x.value = Math.min(usable, Math.max(0, startX.value + event.translationX)); })
    .onEnd(() => { x.value = withSpring(x.value); })
    .runOnJS(true)
    .onChange((event) => { commit(startX.value + event.translationX); });

  const tap = Gesture.Tap().runOnJS(true).onEnd((event) => { commit(event.x - KNOB / 2); });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + KNOB / 2 }));

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Label>Chaos</Label>
        <Label color={t.accent}>{stopFor(value)}</Label>
      </View>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View style={{ height: TRACK_HEIGHT, width, borderRadius: radius.pill, backgroundColor: t.surface, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: t.raised }, fillStyle]} />
          <Animated.View style={[{ position: 'absolute', left: (TRACK_HEIGHT - KNOB) / 2, width: KNOB, height: KNOB, borderRadius: radius.pill, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }, knobStyle]}>
            <Text style={{ fontFamily: font.display, fontSize: 15, color: '#FFFBF4' }}>{Math.round(value * 100)}</Text>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}
