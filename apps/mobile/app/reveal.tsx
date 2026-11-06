import { challengeLink } from '@mise/engine';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Share, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../src/api/client';
import { RecipeView } from '../src/components/recipe/RecipeView';
import { Body, Button, Row, Screen, SPACE } from '../src/components/ui';
import { useStore } from '../src/store/useStore';

/** The moment after the spin: the recipe lands, then you decide what to do with it. */
export default function RevealScreen() {
  const router = useRouter();
  const current = useStore((s) => s.current);
  const saveRecipe = useStore((s) => s.saveRecipe);
  const startCook = useStore((s) => s.startCook);

  useEffect(() => {
    if (!current?.recipe) router.replace('/(tabs)/spin');
  }, [current, router]);

  if (!current?.recipe) return null;
  const { challenge, recipe, fallbackReason } = current;

  const onSave = () => {
    saveRecipe({ challenge, recipe, fallbackReason, rating: null, notes: '', photoUri: null });
    router.push('/(tabs)/kitchen');
  };

  const onCook = () => {
    const run = startCook({ challenge, recipe, fallbackReason });
    router.replace(`/cook/${run.id}`);
  };

  const onShare = async () => {
    await api.saveChallenge(challenge);
    await Share.share({ message: `Cook this with me on Mise: ${challengeLink(challenge)}` }).catch(() => undefined);
  };

  return (
    <Screen>
      <Animated.View entering={FadeInDown.springify().damping(14)}>
        <RecipeView recipe={recipe} challenge={challenge} fallbackReason={fallbackReason} />
      </Animated.View>
      <View style={{ gap: SPACE.sm, marginTop: SPACE.md }}>
        <Button title="Start Cooking" onPress={onCook} size="lg" />
        <Row>
          <Button title="Save" onPress={onSave} variant="secondary" style={{ flex: 1 }} />
          <Button title="Share Spin" onPress={onShare} variant="secondary" style={{ flex: 1 }} />
        </Row>
        <Button title="Back To Spin" onPress={() => router.back()} variant="ghost" />
      </View>
      {fallbackReason !== 'none' ? (
        <Body muted style={{ textAlign: 'center' }}>
          {fallbackReason === 'offline' ? 'You are offline, so this is a basic plan built on your phone.' : fallbackReason === 'ai-unavailable' ? 'The chef is away, so this is a basic plan.' : 'The chef missed the rules twice, so this is a basic plan.'}
        </Body>
      ) : null}
    </Screen>
  );
}
