import { CATEGORY_IDS, type CategoryId, type Mode } from '@mise/schema';
import { CATEGORY_LABEL, createChallenge, EmptyWheelError, MODE_MINUTES, reroll, toggleLock, type Slots } from '@mise/engine';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, useWindowDimensions, View } from 'react-native';
import { PrepBowl, SPIN_TOTAL_MS } from '../../src/components/spin/PrepBowl';
import { ChaosDial } from '../../src/components/ui/ChaosDial';
import { Body, Button, Chip, Label, Row, Screen, Segmented, SPACE, Stepper, Title } from '../../src/components/ui';
import { useRecipe } from '../../src/hooks/useRecipe';
import { haptic } from '../../src/lib/haptics';
import { mintSeed } from '../../src/lib/seed';
import { useStore } from '../../src/store/useStore';
import { categoryColor } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

const MIN_WHEELS = 2;
const MAX_WHEELS = 8;
const TIME_STEP = 5;
const TIME_MIN = 10;
const TIME_MAX = 180;

const MODES: Array<{ value: Mode; label: string }> = [
  { value: 'free-play', label: 'Free' },
  { value: 'quickfire', label: 'Quick' },
  { value: 'standard', label: 'Standard' },
  { value: 'master', label: 'Master' },
];

export default function SpinScreen() {
  const t = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
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
    setConfig({ categories });
    setSlots({});
    setSeed(null);
  };

  const onMode = (mode: Mode) => setConfig({ mode, timeLimitMinutes: MODE_MINUTES[mode] });

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
            <Label>Mode</Label>
            <Segmented options={MODES} value={MODES.some((mode) => mode.value === config.mode) ? config.mode : 'standard'} onChange={onMode} />
          </View>

          <ChaosDial value={config.chaos} onChange={(chaos) => setConfig({ chaos })} width={width - SPACE.lg * 2} />

          <View style={{ gap: SPACE.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label>Time Limit</Label>
              <Chip label={config.timeLimitMinutes === null ? 'No Clock' : 'Clock On'} selected={config.timeLimitMinutes !== null} onPress={() => setConfig({ timeLimitMinutes: config.timeLimitMinutes === null ? 45 : null })} />
            </Row>
            {config.timeLimitMinutes !== null ? (
              <Stepper value={config.timeLimitMinutes} min={TIME_MIN} max={TIME_MAX} step={TIME_STEP} onChange={(timeLimitMinutes) => setConfig({ timeLimitMinutes })} format={(value) => `${value} min`} />
            ) : null}
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
