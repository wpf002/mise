import { createChallenge, dailyConfig, dailySeed, dayKey, rulesRecipe } from '@mise/engine';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { api, OfflineError } from '../../src/api/client';
import { ChallengeStrip } from '../../src/components/recipe/RecipeView';
import { Body, Button, Card, Label, Row, Screen, SourceBadge, SPACE, Title } from '../../src/components/ui';
import { haptic } from '../../src/lib/haptics';
import { deviceTimeZone, formatMinutes } from '../../src/lib/time';
import { useStore, type TodayPick } from '../../src/store/useStore';
import { font, radius } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const GREETING_HOURS = { morning: 12, afternoon: 17 } as const;

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < GREETING_HOURS.morning) return 'Good Morning';
  if (hour < GREETING_HOURS.afternoon) return 'Good Afternoon';
  return 'Good Evening';
}

/** Today's pick: one seed per device per day. Swap once if it doesn't land. */
export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const deviceId = useStore((s) => s.deviceId);
  const profile = useStore((s) => s.profile);
  const onboarded = useStore((s) => s.onboarded);
  const today = useStore((s) => s.today);
  const setToday = useStore((s) => s.setToday);
  const setCurrent = useStore((s) => s.setCurrent);
  const startCook = useStore((s) => s.startCook);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const day = dayKey(new Date(), deviceTimeZone());
  const stale = !today || today.day !== day;

  const load = useCallback(
    async (swap: 0 | 1) => {
      setLoading(true);
      setFailed(false);
      try {
        const outcome = await api.today(deviceId, deviceTimeZone(), profile, swap);
        setToday({ day: outcome.day, swap, challenge: outcome.challenge, recipe: outcome.recipe, fallbackReason: outcome.fallbackReason });
        haptic.success();
      } catch (error) {
        if (error instanceof OfflineError) {
          const config = dailyConfig(profile);
          const challenge = createChallenge(config, dailySeed(`${deviceId}:${swap}`, day));
          setToday({ day, swap, challenge, recipe: rulesRecipe(challenge), fallbackReason: 'offline' });
        } else {
          setFailed(true);
          haptic.warn();
        }
      } finally {
        setLoading(false);
      }
    },
    [day, deviceId, profile, setToday],
  );

  useEffect(() => {
    if (stale && !loading && !failed) load(0);
  }, [stale, loading, failed, load]);

  const open = (pick: TodayPick) => {
    setCurrent({ challenge: pick.challenge, recipe: pick.recipe, fallbackReason: pick.fallbackReason });
    router.push('/reveal');
  };

  const cook = (pick: TodayPick) => {
    const run = startCook({ challenge: pick.challenge, recipe: pick.recipe, fallbackReason: pick.fallbackReason });
    router.push(`/cook/${run.id}`);
  };

  return (
    <Screen>
      <Title kicker={greeting()}>Tonight's Pick</Title>

      {!onboarded ? (
        <Pressable onPress={() => router.push('/onboarding')} style={{ backgroundColor: t.primary, borderRadius: radius.lg, padding: SPACE.lg, gap: 4 }}>
          <Text style={{ fontFamily: font.display, fontSize: 22, color: '#FFFBF4' }}>Set Your Taste</Text>
          <Text style={{ fontFamily: font.body, fontSize: 15, color: '#FFFBF4' }}>Two minutes. Picks get a lot better.</Text>
        </Pressable>
      ) : null}

      {today && !stale ? (
        <Animated.View entering={FadeInUp.springify().damping(15)} style={{ gap: SPACE.md }}>
          <Pressable onPress={() => open(today)} style={{ backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.lg, gap: SPACE.md }}>
            <SourceBadge source={today.recipe.source} offline={today.fallbackReason === 'offline'} />
            <Text style={{ fontFamily: font.display, fontSize: 32, lineHeight: 36, color: t.text }}>{today.recipe.title}</Text>
            <Text style={{ fontFamily: font.displayItalic, fontSize: 17, lineHeight: 24, color: t.muted }}>{today.recipe.concept}</Text>
            <ChallengeStrip challenge={today.challenge} compact />
            <Row gap={SPACE.md}>
              <Label>{formatMinutes(today.recipe.totalMinutes)}</Label>
              <Label>Serves {today.recipe.servings}</Label>
            </Row>
          </Pressable>
          <Button title="Cook Tonight" onPress={() => cook(today)} size="lg" />
          <Row>
            <Button title="Read Recipe" onPress={() => open(today)} variant="secondary" style={{ flex: 1 }} />
            {today.swap === 0 ? <Button title="Not Feeling It" onPress={() => load(1)} variant="ghost" disabled={loading} style={{ flex: 1 }} /> : null}
          </Row>
          {today.swap === 1 ? <Body muted style={{ textAlign: 'center' }}>That was your one swap for today.</Body> : null}
        </Animated.View>
      ) : failed ? (
        <Card>
          <Body>The chef is not answering.</Body>
          <Button title="Try Again" onPress={() => load(0)} variant="secondary" />
        </Card>
      ) : (
        <View style={{ paddingVertical: SPACE.xl, alignItems: 'center' }}>
          <Body muted>Setting tonight's table.</Body>
        </View>
      )}

      <Card>
        <Label>Want Something Else?</Label>
        <Body>Spin your own wheels, or snap the fridge and cook what you have.</Body>
        <Row>
          <Button title="Spin" onPress={() => router.push('/(tabs)/spin')} variant="secondary" style={{ flex: 1 }} />
          <Button title="Snap Fridge" onPress={() => router.push('/(tabs)/snap')} variant="secondary" style={{ flex: 1 }} />
        </Row>
      </Card>
    </Screen>
  );
}
