import { entryById } from '@mise/engine';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ChallengeStrip } from '../../src/components/recipe/RecipeView';
import { Body, Button, Card, Chip, Label, Row, Screen, SourceBadge, SPACE, Title } from '../../src/components/ui';
import { useStore } from '../../src/store/useStore';
import { font, radius } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const SKILL_LABEL = { new: 'New Cook', home: 'Home Cook', confident: 'Confident', pro: 'Pro' } as const;

function savedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Everything you've cooked, what's in the pantry, and who you are as a cook. */
export default function KitchenScreen() {
  const t = useTheme();
  const router = useRouter();
  const history = useStore((s) => s.history);
  const pantry = useStore((s) => s.pantry);
  const profile = useStore((s) => s.profile);
  const setPantry = useStore((s) => s.setPantry);

  return (
    <Screen>
      <Title kicker="Your">Kitchen</Title>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Label>Taste Profile</Label>
            <Body bold>{profile ? SKILL_LABEL[profile.skill] : 'Not Set'}</Body>
            {profile ? <Body muted>{profile.typicalMinutes} min weeknights, serves {profile.servings}</Body> : null}
          </View>
          <Button title={profile ? 'Edit' : 'Set Up'} onPress={() => router.push('/onboarding')} variant="secondary" />
        </Row>
        {profile?.equipmentIds.length ? (
          <Row wrap style={{ marginTop: SPACE.xs }}>
            {profile.equipmentIds.map((id) => {
              const entry = entryById(id);
              return entry ? <Chip key={id} label={entry.label} emoji={entry.emoji} /> : null;
            })}
          </Row>
        ) : null}
      </Card>

      <View style={{ gap: SPACE.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label>Pantry</Label>
          {pantry.length ? <Chip label="Clear" onPress={() => setPantry([])} /> : null}
        </Row>
        {pantry.length ? (
          <Row wrap>
            {pantry.map((id) => {
              const entry = entryById(id);
              return <Chip key={id} label={entry?.label ?? id} emoji={entry?.emoji} selected onPress={() => setPantry(pantry.filter((item) => item !== id))} />;
            })}
          </Row>
        ) : (
          <Body muted>Empty. Snap your fridge to fill it.</Body>
        )}
      </View>

      <View style={{ gap: SPACE.sm }}>
        <Label>Cooked And Saved</Label>
        {history.length === 0 ? <Body muted>Nothing yet. Spin something.</Body> : null}
        {history.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/recipe/${item.id}`)} style={{ backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.md, gap: SPACE.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <SourceBadge source={item.recipe.source} offline={item.fallbackReason === 'offline'} />
              <Label>{savedDate(item.savedAt)}</Label>
            </Row>
            <Text style={{ fontFamily: font.display, fontSize: 22, lineHeight: 26, color: t.text }}>{item.recipe.title}</Text>
            <ChallengeStrip challenge={item.challenge} compact />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
