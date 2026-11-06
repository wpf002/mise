import type { JudgeResult } from '@mise/schema';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { api, OfflineError } from '../../src/api/client';
import { Body, Button, Card, Heading, Label, Row, Screen, SPACE, Title } from '../../src/components/ui';
import { haptic } from '../../src/lib/haptics';
import { pickPhoto, takePhoto, type Photo } from '../../src/lib/photo';
import { useStore } from '../../src/store/useStore';
import { font, radius } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const EVIDENCE_LABEL: Record<JudgeResult['lines'][number]['evidence'], string> = {
  'seen-in-photo': 'Seen In Photo',
  'reported-by-you': 'Your Report',
  'inferred-from-recipe': 'From Recipe',
  'not-verifiable': 'Unverified',
};

const LINE_LABEL: Record<JudgeResult['lines'][number]['category'], string> = {
  flavor: 'Flavor', creativity: 'Creativity', technique: 'Technique', presentation: 'Presentation', compliance: 'Rules',
};

/** Plate the dish. The judge scores from the photo and your notes, and says which is which. */
export default function JudgeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const arena = useStore((s) => s.arena);
  const endArena = useStore((s) => s.endArena);
  const saveRecipe = useStore((s) => s.saveRecipe);
  const [dishName, setDishName] = useState(arena?.recipe.title ?? '');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);

  useEffect(() => {
    if (!arena || arena.id !== id) router.replace('/(tabs)/arena');
  }, [arena, id, router]);

  if (!arena || arena.id !== id) return null;

  const finish = (judge: JudgeResult | null) => {
    saveRecipe({ challenge: arena.challenge, recipe: arena.recipe, fallbackReason: 'none', rating: null, notes: description, photoUri: photo?.uri ?? null, judge });
    endArena();
    router.replace('/(tabs)/kitchen');
  };

  const submit = async () => {
    if (!dishName.trim() || !description.trim()) {
      Alert.alert('Tell The Judge', 'Name the dish and say what you made.');
      return;
    }
    setBusy(true);
    try {
      const judged = await api.judge({ challenge: arena.challenge, dishName: dishName.trim(), description: description.trim(), imageBase64: photo?.base64 });
      setResult(judged);
      haptic.success();
    } catch (error) {
      haptic.warn();
      Alert.alert('No Judge Tonight', error instanceof OfflineError ? 'You are offline. Save it unjudged?' : 'The judge did not answer. Save it unjudged?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Save', onPress: () => finish(null) },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = { fontFamily: font.body, fontSize: 17, color: t.text, backgroundColor: t.surface, borderRadius: radius.md, padding: SPACE.md, minHeight: 56 } as const;

  if (result) {
    return (
      <Screen>
        <Title kicker="AI Estimate">{Math.round(result.total)} Points</Title>
        <Body muted>Scores are the judge's best guess. Each line says what it was based on.</Body>
        {result.lines.map((line) => (
          <Card key={line.category}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Heading>{LINE_LABEL[line.category]}</Heading>
              <Text style={{ fontFamily: font.display, fontSize: 24, color: t.accent }}>{line.score}/{line.max}</Text>
            </Row>
            <Label>{EVIDENCE_LABEL[line.evidence]}</Label>
            <Body>{line.note}</Body>
          </Card>
        ))}
        {result.strengths.length ? (
          <View style={{ gap: 4 }}>
            <Label color={t.accent}>Nailed It</Label>
            {result.strengths.map((line) => <Body key={line}>{line}</Body>)}
          </View>
        ) : null}
        {result.improvements.length ? (
          <View style={{ gap: 4 }}>
            <Label>Next Time</Label>
            {result.improvements.map((line) => <Body key={line}>{line}</Body>)}
          </View>
        ) : null}
        <Button title="Save To Kitchen" onPress={() => finish(result)} size="lg" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title kicker="Time">Plate It</Title>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 1, borderRadius: radius.lg }} contentFit="cover" />
      ) : null}
      <Row>
        <Button title="Photo" onPress={() => takePhoto().then((shot) => shot && setPhoto(shot))} variant="secondary" style={{ flex: 1 }} />
        <Button title="Library" onPress={() => pickPhoto().then((shot) => shot && setPhoto(shot))} variant="secondary" style={{ flex: 1 }} />
      </Row>
      <View style={{ gap: SPACE.xs }}>
        <Label>Dish Name</Label>
        <TextInput value={dishName} onChangeText={setDishName} style={inputStyle} placeholderTextColor={t.muted} placeholder="What do you call it?" />
      </View>
      <View style={{ gap: SPACE.xs }}>
        <Label>What You Made</Label>
        <TextInput value={description} onChangeText={setDescription} multiline style={[inputStyle, { minHeight: 120, textAlignVertical: 'top' }]} placeholderTextColor={t.muted} placeholder="What changed, what worked, what burned." />
      </View>
      <Button title={busy ? 'Judging' : 'Send To Judge'} onPress={submit} size="lg" disabled={busy} />
      <Button title="Save Without Judging" onPress={() => finish(null)} variant="ghost" />
    </Screen>
  );
}
