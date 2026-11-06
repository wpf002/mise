import Ionicons from '@expo/vector-icons/Ionicons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Body, Button, Label, Row, SPACE } from '../../src/components/ui';
import { TimerRing } from '../../src/components/timer/TimerRing';
import { useArenaTimer } from '../../src/hooks/useArenaTimer';
import { haptic } from '../../src/lib/haptics';
import { useStore } from '../../src/store/useStore';
import { font, radius, touch } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

/**
 * Cook Mode. Screen stays awake, every target is at least 72pt, one step at a time.
 * Designed to be driven with a knuckle.
 */
export default function CookScreen() {
  useKeepAwake();
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const arena = useStore((s) => s.arena);
  const pauseArena = useStore((s) => s.pauseArena);
  const resumeArena = useStore((s) => s.resumeArena);
  const remaining = useArenaTimer(arena);
  const [stepIndex, setStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const buzzed = useRef(false);

  useEffect(() => {
    if (!arena || arena.id !== id) router.replace('/(tabs)/arena');
  }, [arena, id, router]);

  useEffect(() => {
    if (remaining === 0 && arena && !buzzed.current) {
      buzzed.current = true;
      haptic.thud();
    }
  }, [remaining, arena]);

  if (!arena || arena.id !== id) return null;
  const steps = arena.recipe.steps;
  const step = steps[stepIndex];
  const last = stepIndex >= steps.length - 1;
  const paused = arena.pausedAt !== null;

  const go = (delta: number) => {
    const next = Math.min(steps.length - 1, Math.max(0, stepIndex + delta));
    if (next !== stepIndex) { haptic.tap(); setStepIndex(next); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, padding: SPACE.lg, gap: SPACE.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Cook Mode" onPress={() => router.back()} style={{ width: touch.cook, height: touch.cook, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-down" size={32} color={t.muted} />
          </Pressable>
          <Label>{arena.mode.replace('-', ' ')}</Label>
          <Pressable accessibilityRole="button" accessibilityLabel="Ingredients" onPress={() => setShowIngredients((value) => !value)} style={{ width: touch.cook, height: touch.cook, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={showIngredients ? 'list' : 'list-outline'} size={30} color={showIngredients ? t.accent : t.muted} />
          </Pressable>
        </Row>

        <View style={{ alignItems: 'center' }}>
          <TimerRing remainingMs={remaining} durationMs={arena.durationMs} size={200} paused={paused} />
        </View>

        {showIngredients ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1, backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.md }}>
            <ScrollView>
              {arena.recipe.ingredients.map((item) => (
                <Row key={item.name} style={{ justifyContent: 'space-between', paddingVertical: 10 }}>
                  <Text style={{ fontFamily: item.mandatory ? font.bodyBold : font.body, fontSize: 20, color: t.text, flex: 1 }}>{item.name}</Text>
                  <Text style={{ fontFamily: font.body, fontSize: 20, color: t.muted }}>{item.quantity}</Text>
                </Row>
              ))}
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View key={stepIndex} entering={FadeIn.duration(180)} style={{ flex: 1, backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.lg, gap: SPACE.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label color={t.accent}>Step {stepIndex + 1} Of {steps.length}</Label>
              <Label>{step ? `${step.durationMinutes} min` : ''}</Label>
            </Row>
            <ScrollView>
              <Text style={{ fontFamily: font.display, fontSize: 28, lineHeight: 36, color: t.text }}>{step?.text ?? ''}</Text>
            </ScrollView>
          </Animated.View>
        )}

        <Row>
          <Button title="Back" onPress={() => go(-1)} variant="secondary" size="cook" disabled={stepIndex === 0} style={{ flex: 1 }} />
          {last ? (
            <Button title="Plate It" onPress={() => router.replace(`/judge/${arena.id}`)} size="cook" style={{ flex: 2 }} />
          ) : (
            <Button title="Next" onPress={() => go(1)} size="cook" style={{ flex: 2 }} />
          )}
        </Row>
        {arena.strict ? (
          <Body muted style={{ textAlign: 'center' }}>No pausing in this mode.</Body>
        ) : (
          <Button title={paused ? 'Resume' : 'Pause'} onPress={paused ? resumeArena : pauseArena} variant="ghost" />
        )}
      </View>
    </SafeAreaView>
  );
}
