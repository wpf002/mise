import { CATEGORY_LABEL, entryById } from '@mise/engine';
import type { Challenge, Recipe } from '@mise/schema';
import { Text, View } from 'react-native';
import type { FallbackReason } from '../../store/useStore';
import { formatMinutes } from '../../lib/time';
import { categoryColor, font, radius } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Body, Card, Heading, Label, Row, SourceBadge, SPACE } from '../ui';

const CATEGORY_KEYS = Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>;

/** The picks that produced a recipe, as a row of glyph tiles. */
export function ChallengeStrip({ challenge, compact }: { challenge: Challenge; compact?: boolean }) {
  const t = useTheme();
  const size = compact ? 44 : 64;
  return (
    <Row wrap gap={SPACE.sm}>
      {CATEGORY_KEYS.map((category) => {
        const slot = challenge.slots[category];
        const entry = slot ? entryById(slot.entryId) : undefined;
        if (!entry) return null;
        return (
          <View key={category} style={{ alignItems: 'center', gap: 4, width: compact ? 52 : 76 }}>
            <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.surface, borderWidth: 3, borderColor: categoryColor[category], alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: compact ? 20 : 30 }}>{entry.emoji}</Text>
            </View>
            {compact ? null : (
              <Text numberOfLines={2} style={{ fontFamily: font.bodyBold, fontSize: 11, color: t.muted, textAlign: 'center' }}>{entry.label}</Text>
            )}
          </View>
        );
      })}
    </Row>
  );
}

export function RecipeView({ recipe, challenge, fallbackReason }: { recipe: Recipe; challenge: Challenge; fallbackReason: FallbackReason }) {
  const t = useTheme();
  return (
    <View style={{ gap: SPACE.lg }}>
      <View style={{ gap: SPACE.sm }}>
        <SourceBadge source={recipe.source} offline={fallbackReason === 'offline'} />
        <Text style={{ fontFamily: font.display, fontSize: 34, lineHeight: 38, color: t.text }}>{recipe.title}</Text>
        <Text style={{ fontFamily: font.displayItalic, fontSize: 18, lineHeight: 26, color: t.muted }}>{recipe.concept}</Text>
        <Row gap={SPACE.md}>
          <Stat label="Prep" value={formatMinutes(recipe.prepMinutes)} />
          <Stat label="Cook" value={formatMinutes(recipe.cookMinutes)} />
          <Stat label="Total" value={formatMinutes(recipe.totalMinutes)} />
          <Stat label="Serves" value={String(recipe.servings)} />
        </Row>
      </View>

      <ChallengeStrip challenge={challenge} />

      {recipe.safetyNotes.length ? (
        <Card tint={t.accent}>
          <Label color={t.accent}>Safety</Label>
          {recipe.safetyNotes.map((note) => <Body key={note}>{note}</Body>)}
        </Card>
      ) : null}

      <View style={{ gap: SPACE.md }}>
        <Heading>Ingredients</Heading>
        {recipe.ingredientGroups.map((group) => (
          <View key={group.title} style={{ gap: SPACE.xs }}>
            <Label color={t.accent}>{group.title}</Label>
            {group.items.map((item, index) => <IngredientLine key={`${item.name}-${index}`} name={item.name} prep={item.prep} quantity={item.quantity} hero={item.mandatory} />)}
          </View>
        ))}
      </View>

      <View style={{ gap: SPACE.md }}>
        <Heading>Steps</Heading>
        {recipe.steps.map((step, index) => (
          <Row key={`${step.title}-${index}`} gap={SPACE.md} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 52, alignItems: 'center', gap: 2 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.display, fontSize: 16, color: '#FFFBF4' }}>{index + 1}</Text>
              </View>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: t.muted }}>{step.durationMinutes} min</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Body bold>{step.title}</Body>
              <Body>{step.text}</Body>
            </View>
          </Row>
        ))}
      </View>

      {recipe.equipment.length ? (
        <View style={{ gap: SPACE.xs }}>
          <Heading>Gear</Heading>
          {recipe.equipment.map((item) => <Bullet key={item} text={item} />)}
        </View>
      ) : null}

      {recipe.tips.length ? (
        <Card>
          <Label>Tips</Label>
          {recipe.tips.map((tip) => <Bullet key={tip} text={tip} />)}
        </Card>
      ) : null}

      {recipe.substitutions.length ? (
        <View style={{ gap: SPACE.xs }}>
          <Heading>Substitutions</Heading>
          {recipe.substitutions.map((sub) => <Bullet key={sub} text={sub} />)}
        </View>
      ) : null}

      <Card>
        <Label>Flavor</Label>
        <Body>{recipe.flavorNotes}</Body>
        <Label style={{ marginTop: SPACE.sm }}>Plating</Label>
        <Body>{recipe.plating}</Body>
        <Label style={{ marginTop: SPACE.sm }}>Storage</Label>
        <Body>{recipe.storage}</Body>
      </Card>

      {recipe.alternatives.length ? (
        <View style={{ gap: SPACE.sm }}>
          <Heading>Or Try</Heading>
          {recipe.alternatives.map((alt) => (
            <View key={alt.title} style={{ borderRadius: radius.md, borderWidth: 1.5, borderColor: t.raised, padding: SPACE.md, gap: 2 }}>
              <Body bold>{alt.title}</Body>
              <Body muted>{alt.pitch}</Body>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  const t = useTheme();
  return (
    <Row gap={SPACE.sm} style={{ alignItems: 'flex-start' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent, marginTop: 9 }} />
      <Body style={{ flex: 1 }}>{text}</Body>
    </Row>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Label>{label}</Label>
      <Text style={{ fontFamily: font.display, fontSize: 20, color: t.text }}>{value}</Text>
    </View>
  );
}

/** Keeps a long quantity from squeezing the name column. */
const QUANTITY_MAX_WIDTH = 140;

function IngredientLine({ name, prep, quantity, hero }: { name: string; prep?: string; quantity: string; hero?: boolean }) {
  const t = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.surface }}>
      <Row gap={SPACE.sm} style={{ flex: 1, alignItems: 'flex-start' }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hero ? t.primary : t.raised, marginTop: 8 }} />
        <View style={{ flex: 1 }}>
          <Body bold={hero}>{name}</Body>
          {prep ? <Body muted>{prep}</Body> : null}
        </View>
      </Row>
      <Body muted style={{ marginLeft: SPACE.sm, maxWidth: QUANTITY_MAX_WIDTH, textAlign: 'right' }}>{quantity}</Body>
    </Row>
  );
}
