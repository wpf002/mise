import { createChallenge, DEFAULT_CONFIG } from '@mise/engine';
import type { Challenge } from '@mise/schema';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api } from '../../src/api/client';
import { ChallengeStrip } from '../../src/components/recipe/RecipeView';
import { Body, Button, Screen, Title } from '../../src/components/ui';
import { useRecipe } from '../../src/hooks/useRecipe';

/**
 * Deep link mise://c/<id>?s=<seed>. Fetch the shared challenge; if the API is
 * unreachable, re-spin the seed with the default config so the link still works.
 */
export default function SharedChallengeScreen() {
  const router = useRouter();
  const { id, s: seed } = useLocalSearchParams<{ id: string; s?: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [missing, setMissing] = useState(false);
  const recipe = useRecipe();

  useEffect(() => {
    let active = true;
    api.getChallenge(id).then((fetched) => {
      if (!active) return;
      if (fetched) setChallenge(fetched);
      else if (seed) setChallenge(createChallenge(DEFAULT_CONFIG, seed));
      else setMissing(true);
    });
    return () => { active = false; };
  }, [id, seed]);

  const cook = async () => {
    if (!challenge) return;
    const run = await recipe.mutateAsync(challenge).catch(() => null);
    if (!run) {
      Alert.alert('No Recipe', 'The chef did not answer. Try again in a moment.');
      return;
    }
    router.replace('/reveal');
  };

  return (
    <Screen>
      <Title kicker="Shared Spin">Same Wheels</Title>
      {missing ? <Body muted>This link is missing its seed.</Body> : null}
      {challenge ? (
        <>
          <Body>Someone sent you their spin. Cook the same picks and compare plates.</Body>
          <ChallengeStrip challenge={challenge} />
          <Button title={recipe.isPending ? 'Asking The Chef' : 'Cook It'} onPress={cook} size="lg" disabled={recipe.isPending} />
        </>
      ) : !missing ? (
        <Body muted>Loading the spin.</Body>
      ) : null}
      <Button title="Home" onPress={() => router.replace('/(tabs)')} variant="ghost" />
    </Screen>
  );
}
