import Ionicons from '@expo/vector-icons/Ionicons';
import { recipeIngredients } from '@mise/schema';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Body, Button, Label, Row, SPACE } from '../../src/components/ui';
import { haptic } from '../../src/lib/haptics';
import { useStore } from '../../src/store/useStore';
import { font, radius, touch } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';

/** Keeps a long quantity like "1 lb large (16 to 20 count)" from squeezing the name. */
const QUANTITY_MAX_WIDTH = 150;

/**
 * Cook Mode. Screen stays awake, every target is at least 72pt, one step at a time.
 * Designed to be driven with a knuckle.
 */
export default function CookScreen() {
  useKeepAwake();
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cook = useStore((s) => s.cook);
  const endCook = useStore((s) => s.endCook);
  const saveRecipe = useStore((s) => s.saveRecipe);
  const [stepIndex, setStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  /** Done clears the cook run; without this the missing-run redirect below would win over the Kitchen navigation. */
  const finishing = useRef(false);

  useEffect(() => {
    if (finishing.current) return;
    if (!cook || cook.id !== id) router.replace('/(tabs)/spin');
  }, [cook, id, router]);

  if (!cook || cook.id !== id) return null;
  const steps = cook.recipe.steps;
  const step = steps[stepIndex];
  const last = stepIndex >= steps.length - 1;
  const ingredients = recipeIngredients(cook.recipe);

  const go = (delta: number) => {
    const next = Math.min(steps.length - 1, Math.max(0, stepIndex + delta));
    if (next !== stepIndex) { haptic.tap(); setStepIndex(next); }
  };

  const finish = () => {
    finishing.current = true;
    haptic.thud();
    saveRecipe({ challenge: cook.challenge, recipe: cook.recipe, fallbackReason: cook.fallbackReason, rating: null, notes: '', photoUri: null });
    endCook();
    router.replace('/(tabs)/kitchen');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, padding: SPACE.lg, gap: SPACE.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Cook Mode" onPress={() => router.back()} style={{ width: touch.cook, height: touch.cook, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-down" size={32} color={t.muted} />
          </Pressable>
          <Label>Cook Mode</Label>
          <Pressable accessibilityRole="button" accessibilityLabel="Ingredients" onPress={() => setShowIngredients((value) => !value)} style={{ width: touch.cook, height: touch.cook, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={showIngredients ? 'list' : 'list-outline'} size={30} color={showIngredients ? t.accent : t.muted} />
          </Pressable>
        </Row>

        <Text numberOfLines={2} style={{ fontFamily: font.displayItalic, fontSize: 18, lineHeight: 24, color: t.muted }}>{cook.recipe.title}</Text>

        {showIngredients ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1, backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.md }}>
            <ScrollView>
              {ingredients.map((item) => (
                <Row key={item.name} style={{ justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: item.mandatory ? font.bodyBold : font.body, fontSize: 20, color: t.text }}>{item.name}</Text>
                    {item.prep ? <Body muted>{item.prep}</Body> : null}
                  </View>
                  <Text style={{ fontFamily: font.body, fontSize: 20, color: t.muted, marginLeft: SPACE.sm, maxWidth: QUANTITY_MAX_WIDTH, textAlign: 'right' }}>{item.quantity}</Text>
                </Row>
              ))}
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View key={stepIndex} entering={FadeIn.duration(180)} style={{ flex: 1, backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.lg, gap: SPACE.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label color={t.accent}>Step {stepIndex + 1} Of {steps.length}</Label>
              <Label>{step ? `${step.durationMinutes} min` : ''}</Label>
            </Row>
            <ScrollView contentContainerStyle={{ gap: SPACE.sm }}>
              <Text style={{ fontFamily: font.display, fontSize: 30, lineHeight: 36, color: t.text }}>{step?.title ?? ''}</Text>
              <Text style={{ fontFamily: font.body, fontSize: 20, lineHeight: 30, color: t.text }}>{step?.text ?? ''}</Text>
            </ScrollView>
          </Animated.View>
        )}

        <Row>
          <Button title="Back" onPress={() => go(-1)} variant="secondary" size="cook" disabled={stepIndex === 0} style={{ flex: 1 }} />
          {last ? (
            <Button title="Done" onPress={finish} size="cook" style={{ flex: 2 }} />
          ) : (
            <Button title="Next" onPress={() => go(1)} size="cook" style={{ flex: 2 }} />
          )}
        </Row>
      </View>
    </SafeAreaView>
  );
}
