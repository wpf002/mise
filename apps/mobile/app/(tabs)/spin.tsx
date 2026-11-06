import { CATEGORY_IDS, type CategoryId, type ChallengeConfig } from '@mise/schema';
import { CATEGORY_LABEL, createChallenge, EmptyWheelError, LEVELS, reroll, toggleLock, type Slots } from '@mise/engine';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { PrepBowl, SPIN_TOTAL_MS } from '../../src/components/spin/PrepBowl';
import { Body, Button, Chip, Label, Row, Screen, SPACE, Title } from '../../src/components/ui';
import { useRecipe } from '../../src/hooks/useRecipe';
import { haptic } from '../../src/lib/haptics';
import { mintSeed } from '../../src/lib/seed';
import { useStore } from '../../src/store/useStore';
import { categoryColor } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const MIN_WHEELS = 2;
const MAX_WHEELS = 8;

/** One-tap wheel setups. Each sets the mode so the chip reads as selected until the wheels change again. */
const PRESETS: Array<{ label: string; patch: Partial<ChallengeConfig> }> = [
  { label: 'Mystery Basket', patch: { mode: 'mystery-basket', categories: ['protein', 'produce', 'equipment', 'style', 'wildcard', 'flavor'] } },
  { label: 'Kitchen Chaos', patch: { mode: 'kitchen-chaos', categories: [...CATEGORY_IDS] } },
];

export default function SpinScreen() {
  const t = useTheme();
  const router = useRouter();
  const config = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const [seed, setSeed] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>({});
  const [spinning, setSpinning] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const recipe = useRecipe();

  const hasSpin = seed !== null && Object.keys(slots).length > 0;

  const runSpin = useCallback(
    (nextSeed: string, previous: Slots) => {
      try {
        const challenge = createChallenge(config, nextSeed, previous);
        setSeed(nextSeed);
        setSlots(challenge.slots);
        setSpinning(true);
        setShowSetup(false);
        setTimeout(() => setSpinning(false), SPIN_TOTAL_MS(config.categories.length));
      } catch (error) {
        haptic.warn();
        const message = error instanceof EmptyWheelError ? error.message : 'Could not spin with these settings.';
        Alert.alert('Empty Wheel', message);
      }
    },
    [config],
  );

  const onSpin = () => runSpin(mintSeed(), slots);

  const onReroll = (category: CategoryId) => {
    if (!seed) return;
    setSlots(reroll(config, seed, slots, category));
    setSpinning(true);
    setTimeout(() => setSpinning(false), SPIN_TOTAL_MS(1));
  };

  const onToggleCategory = (category: CategoryId) => {
    const on = config.categories.includes(category);
    if (on && config.categories.length <= MIN_WHEELS) return;
    if (!on && config.categories.length >= MAX_WHEELS) return;
    const categories = on ? config.categories.filter((item) => item !== category) : [...CATEGORY_IDS].filter((item) => item === category || config.categories.includes(item));
    setConfig({ categories, mode: 'free-play' });
    setSlots({});
    setSeed(null);
  };

  const onLevel = (level: (typeof LEVELS)[number]) => {
    if (level.difficulty === config.difficulty) return;
    haptic.tick();
    setConfig({ difficulty: level.difficulty, chaos: level.chaos });
    setSlots({});
    setSeed(null);
  };

  const onPreset = (patch: Partial<ChallengeConfig>) => {
    haptic.tick();
    setConfig(patch);
    setSlots({});
    setSeed(null);
  };

  const onCook = async () => {
    if (!seed) return;
    const challenge = createChallenge(config, seed, slots);
    const run = await recipe.mutateAsync(challenge).catch(() => null);
    if (!run) {
      Alert.alert('No Recipe', 'The chef did not answer. Try again in a moment.');
      return;
    }
    router.push('/reveal');
  };

  const bowls = useMemo(() => config.categories.map((category, index) => ({ category, index })), [config.categories]);

  return (
    <Screen>
      <Title kicker="Mise">Spin</Title>

      {showSetup || !hasSpin ? (
        <View style={{ gap: SPACE.lg }}>
          <View style={{ gap: SPACE.sm }}>
            <Label>Wheels</Label>
            <Row wrap>
              {CATEGORY_IDS.map((category) => (
                <Chip key={category} label={CATEGORY_LABEL[category]} color={categoryColor[category]} selected={config.categories.includes(category)} onPress={() => onToggleCategory(category)} />
              ))}
            </Row>
          </View>

          <View style={{ gap: SPACE.sm }}>
            <Label>Presets</Label>
            <Row wrap>
              {PRESETS.map((preset) => (
                <Chip key={preset.label} label={preset.label} selected={config.mode === preset.patch.mode} onPress={() => onPreset(preset.patch)} />
              ))}
            </Row>
          </View>

          <View style={{ gap: SPACE.sm }}>
            <Label>Level</Label>
            <Row wrap>
              {LEVELS.map((level) => (
                <Chip key={level.label} label={level.label} selected={config.difficulty === level.difficulty} onPress={() => onLevel(level)} />
              ))}
            </Row>
          </View>
        </View>
      ) : null}

      {hasSpin ? (
        <View style={{ gap: SPACE.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body muted>Tap a bowl to reroll. Hold to lock.</Body>
            <Chip label={showSetup ? 'Hide Setup' : 'Setup'} onPress={() => setShowSetup((value) => !value)} />
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACE.md }}>
            {bowls.map(({ category, index }) => {
              const slot = slots[category];
              return (
                <PrepBowl
                  key={category}
                  category={category}
                  index={index}
                  entryId={slot?.entryId ?? null}
                  locked={slot?.locked ?? false}
                  spinning={spinning}
                  onToggleLock={() => setSlots(toggleLock(slots, category))}
                  onReroll={() => onReroll(category)}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: SPACE.lg }}>
          <Body muted>Pick your wheels, then spin.</Body>
        </View>
      )}

      <View style={{ gap: SPACE.sm, marginTop: SPACE.sm }}>
        <Button title={hasSpin ? 'Spin Again' : 'Spin'} onPress={onSpin} variant={hasSpin ? 'secondary' : 'primary'} size="lg" disabled={spinning || recipe.isPending} />
        {hasSpin ? <Button title={recipe.isPending ? 'Asking The Chef' : 'Cook It'} onPress={onCook} size="lg" disabled={spinning || recipe.isPending} /> : null}
      </View>
      {recipe.isPending ? <Body muted style={{ textAlign: 'center', color: t.muted }}>Writing a recipe for exactly these picks.</Body> : null}
    </Screen>
  );
}
