import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { RecipeView } from '../../src/components/recipe/RecipeView';
import { Body, Button, Card, Label, Row, Screen, SPACE } from '../../src/components/ui';
import { haptic } from '../../src/lib/haptics';
import { MINUTE_MS } from '../../src/lib/time';
import { useStore } from '../../src/store/useStore';
import { font, radius, touch } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const STARS = [1, 2, 3, 4, 5] as const;

export default function SavedRecipeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const saved = useStore((s) => s.history.find((item) => item.id === id));
  const updateSaved = useStore((s) => s.updateSaved);
  const removeSaved = useStore((s) => s.removeSaved);
  const startArena = useStore((s) => s.startArena);

  useEffect(() => {
    if (!saved) router.replace('/(tabs)/kitchen');
  }, [saved, router]);

  if (!saved) return null;

  const cookAgain = () => {
    const minutes = saved.challenge.config.timeLimitMinutes ?? saved.recipe.totalMinutes;
    const run = startArena({ mode: saved.challenge.config.mode, challenge: saved.challenge, recipe: saved.recipe, startedAt: Date.now(), durationMs: minutes * MINUTE_MS, strict: false });
    router.push(`/cook/${run.id}`);
  };

  const remove = () =>
    Alert.alert('Remove Recipe?', 'This only removes it from your kitchen.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removeSaved(saved.id); router.back(); } },
    ]);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ alignSelf: 'flex-start', minHeight: touch.min, justifyContent: 'center' }}>
        <Label>Back</Label>
      </Pressable>

      <Card>
        <Label>Your Rating</Label>
        <Row>
          {STARS.map((star) => (
            <Pressable key={star} accessibilityRole="button" accessibilityLabel={`${star} stars`} onPress={() => { haptic.tick(); updateSaved(saved.id, { rating: star }); }} style={{ width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.display, fontSize: 28, color: saved.rating !== null && star <= saved.rating ? t.accent : t.raised }}>★</Text>
            </Pressable>
          ))}
        </Row>
        <Label>Notes</Label>
        <TextInput
          value={saved.notes}
          onChangeText={(notes) => updateSaved(saved.id, { notes })}
          multiline
          placeholder="What would you change next time?"
          placeholderTextColor={t.muted}
          style={{ fontFamily: font.body, fontSize: 17, color: t.text, backgroundColor: t.raised, borderRadius: radius.md, padding: SPACE.md, minHeight: 80, textAlignVertical: 'top' }}
        />
      </Card>

      {saved.judge ? (
        <Card tint={t.accent}>
          <Label color={t.accent}>AI Estimate</Label>
          <Text style={{ fontFamily: font.display, fontSize: 32, color: t.text }}>{Math.round(saved.judge.total)} Points</Text>
          {saved.judge.strengths.slice(0, 2).map((line) => <Body key={line}>{line}</Body>)}
        </Card>
      ) : null}

      <RecipeView recipe={saved.recipe} challenge={saved.challenge} fallbackReason={saved.fallbackReason} />

      <View style={{ gap: SPACE.sm }}>
        <Button title="Cook Again" onPress={cookAgain} size="lg" />
        <Button title="Remove" onPress={remove} variant="ghost" />
      </View>
    </Screen>
  );
}
