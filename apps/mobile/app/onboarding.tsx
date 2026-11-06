import { entriesIn } from '@mise/engine';
import { Allergen, Diet, type TasteProfile } from '@mise/schema';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Chip, Label, Row, Screen, Segmented, SPACE, Stepper, Title } from '../src/components/ui';
import { useStore } from '../src/store/useStore';

const SKILLS: Array<{ value: TasteProfile['skill']; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'home', label: 'Home' },
  { value: 'confident', label: 'Confident' },
  { value: 'pro', label: 'Pro' },
];
const DIFFICULTY_BY_SKILL: Record<TasteProfile['skill'], TasteProfile['preferredDifficulty']> = { new: 'easy', home: 'easy', confident: 'standard', pro: 'master' };
const ALLERGEN_LABEL: Record<Allergen, string> = { milk: 'Milk', egg: 'Egg', fish: 'Fish', shellfish: 'Shellfish', 'tree-nut': 'Tree Nut', peanut: 'Peanut', wheat: 'Wheat', soy: 'Soy', sesame: 'Sesame' };
const DIET_LABEL: Record<Diet, string> = { vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', 'gluten-free': 'Gluten Free', 'dairy-free': 'Dairy Free', halal: 'Halal', kosher: 'Kosher' };
const MINUTES = { min: 15, max: 120, step: 5 } as const;
const SERVINGS = { min: 1, max: 8 } as const;
const COMMON_GEAR = ['cast-iron', 'nonstick-skillet', 'sheet-pan', 'saucepan', 'stockpot', 'dutch-oven', 'air-fryer', 'instant-pot', 'slow-cooker', 'blender', 'microwave', 'toaster', 'grill', 'wok', 'rice-cooker', 'stand-mixer'];

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

/** Taste profile. Every answer only narrows what the wheels can land on. */
export default function OnboardingScreen() {
  const router = useRouter();
  const existing = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [skill, setSkill] = useState<TasteProfile['skill']>(existing?.skill ?? 'home');
  const [allergens, setAllergens] = useState<Allergen[]>(existing?.allergens ?? []);
  const [diets, setDiets] = useState<Diet[]>(existing?.diets ?? []);
  const [equipmentIds, setEquipment] = useState<string[]>(existing?.equipmentIds ?? []);
  const [typicalMinutes, setMinutes] = useState(existing?.typicalMinutes ?? 45);
  const [servings, setServings] = useState(existing?.servings ?? 2);

  const gear = entriesIn('equipment').filter((entry) => COMMON_GEAR.includes(entry.id));

  const save = () => {
    setProfile({
      skill,
      favoriteCuisines: existing?.favoriteCuisines ?? [],
      favoriteProteins: existing?.favoriteProteins ?? [],
      dislikedEntryIds: existing?.dislikedEntryIds ?? [],
      allergens,
      diets,
      equipmentIds,
      typicalMinutes,
      servings,
      preferredDifficulty: DIFFICULTY_BY_SKILL[skill],
    });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <Screen>
      <Title kicker="Taste">Your Profile</Title>

      <View style={{ gap: SPACE.sm }}>
        <Label>How Do You Cook?</Label>
        <Segmented options={SKILLS} value={skill} onChange={setSkill} />
      </View>

      <View style={{ gap: SPACE.sm }}>
        <Label>Allergies</Label>
        <Row wrap>
          {Allergen.options.map((item) => <Chip key={item} label={ALLERGEN_LABEL[item]} selected={allergens.includes(item)} onPress={() => setAllergens(toggle(allergens, item))} />)}
        </Row>
        <Body muted>Allergens never land on a wheel. Always check your labels.</Body>
      </View>

      <View style={{ gap: SPACE.sm }}>
        <Label>Diet</Label>
        <Row wrap>
          {Diet.options.map((item) => <Chip key={item} label={DIET_LABEL[item]} selected={diets.includes(item)} onPress={() => setDiets(toggle(diets, item))} />)}
        </Row>
      </View>

      <View style={{ gap: SPACE.sm }}>
        <Label>Gear You Own</Label>
        <Row wrap>
          {gear.map((entry) => <Chip key={entry.id} label={entry.label} emoji={entry.emoji} selected={equipmentIds.includes(entry.id)} onPress={() => setEquipment(toggle(equipmentIds, entry.id))} />)}
        </Row>
        <Body muted>Pick none and every tool stays in play.</Body>
      </View>

      <View style={{ gap: SPACE.sm }}>
        <Label>Weeknight Minutes</Label>
        <Stepper value={typicalMinutes} min={MINUTES.min} max={MINUTES.max} step={MINUTES.step} onChange={setMinutes} format={(value) => `${value} min`} />
      </View>

      <View style={{ gap: SPACE.sm }}>
        <Label>Serves</Label>
        <Stepper value={servings} min={SERVINGS.min} max={SERVINGS.max} onChange={setServings} />
      </View>

      <Button title="Save Profile" onPress={save} size="lg" />
    </Screen>
  );
}
