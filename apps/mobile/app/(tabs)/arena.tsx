import { createChallenge, dailyConfig, MODE_MINUTES } from '@mise/engine';
import type { Mode } from '@mise/schema';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ChallengeStrip } from '../../src/components/recipe/RecipeView';
import { Body, Button, Card, Heading, Label, Row, Screen, SPACE } from '../../src/components/ui';
import { TimerRing } from '../../src/components/timer/TimerRing';
import { useArenaTimer } from '../../src/hooks/useArenaTimer';
import { useRecipe } from '../../src/hooks/useRecipe';
import { haptic } from '../../src/lib/haptics';
import { mintSeed } from '../../src/lib/seed';
import { MINUTE_MS } from '../../src/lib/time';
import { useStore } from '../../src/store/useStore';
import { font, radius } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const ARENA_MODES: Array<{ mode: Mode; title: string; pitch: string; strict: boolean }> = [
  { mode: 'quickfire', title: 'Quickfire', pitch: '20 minutes. Four wheels. Go.', strict: false },
  { mode: 'standard', title: 'Standard', pitch: '45 minutes with a pause button.', strict: false },
  { mode: 'master', title: 'Master', pitch: '90 minutes. No pausing. Judged hard.', strict: true },
  { mode: 'mystery-basket', title: 'Mystery Basket', pitch: 'Six wheels, chaos up. Use everything.', strict: false },
  { mode: 'kitchen-chaos', title: 'Kitchen Chaos', pitch: '30 minutes, chaos maxed.', strict: true },
];

const CHAOS_BY_MODE: Partial<Record<Mode, number>> = { 'mystery-basket': 0.6, 'kitchen-chaos': 1 };

export default function ArenaScreen() {
  const t = useTheme();
  const router = useRouter();
  const arena = useStore((s) => s.arena);
  const config = useStore((s) => s.config);
  const profile = useStore((s) => s.profile);
  const startArena = useStore((s) => s.startArena);
  const endArena = useStore((s) => s.endArena);
  const current = useStore((s) => s.current);
  const recipe = useRecipe();
  const [picked, setPicked] = useState<Mode>('standard');
  const remaining = useArenaTimer(arena);

  const onStart = async () => {
    const entry = ARENA_MODES.find((item) => item.mode === picked);
    if (!entry) return;
    const minutes = MODE_MINUTES[picked] ?? 45;
    const base = profile ? dailyConfig(profile) : config;
    const challenge = createChallenge(
      {
        ...base,
        mode: picked,
        timeLimitMinutes: minutes,
        chaos: CHAOS_BY_MODE[picked] ?? base.chaos,
        categories: picked === 'mystery-basket' ? ['protein', 'produce', 'equipment', 'style', 'wildcard', 'flavor'] : base.categories,
      },
      mintSeed(),
    );
    const run = await recipe.mutateAsync(challenge).catch(() => null);
    if (!run?.recipe) {
      Alert.alert('No Recipe', 'The chef did not answer. Try again in a moment.');
      return;
    }
    const started = startArena({ mode: picked, challenge, recipe: run.recipe, startedAt: Date.now(), durationMs: minutes * MINUTE_MS, strict: entry.strict });
    router.push(`/cook/${started.id}`);
  };

  const onCookCurrent = () => {
    if (!current?.recipe) return;
    const minutes = current.challenge.config.timeLimitMinutes ?? current.recipe.totalMinutes;
    const started = startArena({ mode: current.challenge.config.mode, challenge: current.challenge, recipe: current.recipe, startedAt: Date.now(), durationMs: minutes * MINUTE_MS, strict: false });
    router.push(`/cook/${started.id}`);
  };

  const onAbandon = () =>
    Alert.alert('Leave The Arena?', 'The clock and this recipe will be dropped.', [
      { text: 'Keep Cooking', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => { haptic.warn(); endArena(); } },
    ]);

  if (arena) {
    return (
      <Screen>
        <Heading>Run In Progress</Heading>
        <Pressable onPress={() => router.push(`/cook/${arena.id}`)} style={{ alignItems: 'center', gap: SPACE.md, paddingVertical: SPACE.md }}>
          <TimerRing remainingMs={remaining} durationMs={arena.durationMs} paused={arena.pausedAt !== null} />
          <Text style={{ fontFamily: font.display, fontSize: 24, color: t.text, textAlign: 'center' }}>{arena.recipe.title}</Text>
          <ChallengeStrip challenge={arena.challenge} compact />
        </Pressable>
        <Button title="Back To Cook Mode" onPress={() => router.push(`/cook/${arena.id}`)} size="lg" />
        <Button title="Leave Run" onPress={onAbandon} variant="ghost" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: SPACE.xs }}>
        <Label color={t.accent}>Arena</Label>
        <Text style={{ fontFamily: font.display, fontSize: 40, lineHeight: 44, color: t.text }}>Cook Against The Clock</Text>
      </View>

      <View style={{ gap: SPACE.sm }}>
        {ARENA_MODES.map((item) => {
          const active = item.mode === picked;
          return (
            <Pressable
              key={item.mode}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => { haptic.tick(); setPicked(item.mode); }}
              style={{ borderRadius: radius.lg, padding: SPACE.md, backgroundColor: active ? t.raised : t.surface, borderWidth: 2, borderColor: active ? t.primary : 'transparent', gap: 2 }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: font.display, fontSize: 22, color: t.text }}>{item.title}</Text>
                <Label color={active ? t.primary : t.muted}>{MODE_MINUTES[item.mode] ?? 0} min</Label>
              </Row>
              <Body muted>{item.pitch}</Body>
            </Pressable>
          );
        })}
      </View>

      <Button title={recipe.isPending ? 'Setting The Table' : 'Start Run'} onPress={onStart} size="lg" disabled={recipe.isPending} />

      {current?.recipe ? (
        <Card>
          <Label>Or Cook Your Last Spin</Label>
          <Body bold>{current.recipe.title}</Body>
          <Button title="Cook This" onPress={onCookCurrent} variant="secondary" />
        </Card>
      ) : null}
    </Screen>
  );
}
