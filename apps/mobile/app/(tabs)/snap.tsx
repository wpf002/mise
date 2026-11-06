import { entryById } from '@mise/engine';
import type { DetectedIngredient } from '@mise/schema';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { api, ApiError, OfflineError } from '../../src/api/client';
import { Body, Button, Card, Chip, Label, Row, Screen, SPACE, Title } from '../../src/components/ui';
import { haptic } from '../../src/lib/haptics';
import { pickPhoto, takePhoto, type Photo } from '../../src/lib/photo';
import { useStore } from '../../src/store/useStore';
import { radius } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const LOW_CONFIDENCE = 0.5;

/** Fridge Snap: photo in, ingredient guesses out. You confirm each one before it touches a spin. */
export default function SnapScreen() {
  const t = useTheme();
  const router = useRouter();
  const pantry = useStore((s) => s.pantry);
  const setPantry = useStore((s) => s.setPantry);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [found, setFound] = useState<DetectedIngredient[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const scan = async (source: 'camera' | 'library') => {
    setBusy(true);
    try {
      const shot = source === 'camera' ? await takePhoto() : await pickPhoto();
      if (!shot) return;
      setPhoto(shot);
      const { ingredients } = await api.snap(shot.base64, 'image/jpeg');
      setFound(ingredients);
      setChosen(new Set(ingredients.filter((item) => item.entryId && item.confidence >= LOW_CONFIDENCE).map((item) => item.entryId as string)));
      haptic.success();
    } catch (error) {
      haptic.warn();
      const message = error instanceof OfflineError ? 'You are offline. Snap needs the chef.' : error instanceof ApiError ? error.message : 'Could not read that photo.';
      Alert.alert('Snap Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (entryId: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });

  const addToPantry = () => {
    setPantry(Array.from(new Set([...pantry, ...chosen])));
    haptic.success();
    router.push('/(tabs)/spin');
  };

  const known = found.filter((item) => item.entryId);
  const unknown = found.filter((item) => !item.entryId);

  return (
    <Screen>
      <Title kicker="Fridge">Snap</Title>
      <Body muted>Photograph the shelf. Confirm what it saw. Spins lean on your pantry.</Body>

      {photo ? (
        <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: t.surface }} contentFit="cover" />
      ) : (
        <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: t.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: t.raised, alignItems: 'center', justifyContent: 'center' }}>
          <Body muted>No photo yet.</Body>
        </View>
      )}

      <Row>
        <Button title={busy ? 'Looking' : 'Take Photo'} onPress={() => scan('camera')} disabled={busy} style={{ flex: 1 }} />
        <Button title="Choose Photo" onPress={() => scan('library')} variant="secondary" disabled={busy} style={{ flex: 1 }} />
      </Row>

      {known.length ? (
        <View style={{ gap: SPACE.sm }}>
          <Label>Found</Label>
          <Row wrap>
            {known.map((item) => {
              const id = item.entryId as string;
              const entry = entryById(id);
              return <Chip key={id} label={entry?.label ?? item.name} emoji={entry?.emoji} selected={chosen.has(id)} onPress={() => toggle(id)} />;
            })}
          </Row>
          {unknown.length ? <Body muted>Also saw: {unknown.map((item) => item.name).join(', ')}. Not in the library yet.</Body> : null}
          <Button title="Add To Pantry" onPress={addToPantry} size="lg" disabled={chosen.size === 0} />
        </View>
      ) : null}

      {pantry.length ? (
        <Card>
          <Label>In Your Pantry</Label>
          <Row wrap>
            {pantry.map((id) => {
              const entry = entryById(id);
              return <Chip key={id} label={entry?.label ?? id} emoji={entry?.emoji} selected onPress={() => setPantry(pantry.filter((item) => item !== id))} />;
            })}
          </Row>
          <Body muted>Tap one to remove it.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
