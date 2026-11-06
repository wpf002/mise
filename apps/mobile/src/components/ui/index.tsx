import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptic } from '../../lib/haptics';
import { font, radius, touch } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

export const SPACE = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;

export function Screen({ children, scroll = true, padded = true }: PropsWithChildren<{ scroll?: boolean; padded?: boolean }>) {
  const t = useTheme();
  const content = padded ? <View style={{ padding: SPACE.lg, gap: SPACE.md }}>{children}</View> : children;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: SPACE.xl }} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, kicker, style }: { children: ReactNode; kicker?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <View style={{ gap: SPACE.xs }}>
      {kicker ? <Text style={{ fontFamily: font.bodyBold, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: t.accent }}>{kicker}</Text> : null}
      <Text style={[{ fontFamily: font.display, fontSize: 40, lineHeight: 44, color: t.text }, style]}>{children}</Text>
    </View>
  );
}

export function Heading({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: font.display, fontSize: 24, lineHeight: 28, color: t.text }, style]}>{children}</Text>;
}

export function Body({ children, muted, bold, style, numberOfLines }: { children: ReactNode; muted?: boolean; bold?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: bold ? font.bodyBold : font.body, fontSize: 17, lineHeight: 24, color: muted ? t.muted : t.text }, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: color ?? t.muted }, style]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title, onPress, variant = 'primary', disabled, size = 'md', style, icon,
}: { title: string; onPress: () => void; variant?: ButtonVariant; disabled?: boolean; size?: 'md' | 'lg' | 'cook'; style?: StyleProp<ViewStyle>; icon?: ReactNode }) {
  const t = useTheme();
  const height = size === 'cook' ? touch.cook : size === 'lg' ? 64 : touch.min;
  const background = variant === 'primary' ? t.primary : variant === 'secondary' ? t.raised : variant === 'danger' ? '#8E2F1C' : 'transparent';
  const color = variant === 'primary' || variant === 'danger' ? '#FFFBF4' : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          height, borderRadius: radius.pill, backgroundColor: background, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: SPACE.lg, flexDirection: 'row', gap: SPACE.sm,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
          borderWidth: variant === 'ghost' ? 1.5 : 0, borderColor: t.raised,
        },
        style,
      ]}
    >
      {icon}
      <Text style={{ fontFamily: font.bodyBold, fontSize: size === 'cook' ? 22 : 17, color }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, color, emoji }: { label: string; selected?: boolean; onPress?: () => void; color?: string; emoji?: string }) {
  const t = useTheme();
  const tint = color ?? t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress ? () => { haptic.tick(); onPress(); } : undefined}
      style={({ pressed }) => ({
        minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
        backgroundColor: selected ? tint : t.surface, borderWidth: 1.5, borderColor: selected ? tint : t.raised,
        flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.8 : 1,
      })}
    >
      {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}
      <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: selected ? '#FFFBF4' : t.text }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, tint }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; tint?: string }>) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: radius.lg, padding: SPACE.lg, gap: SPACE.sm, borderLeftWidth: tint ? 6 : 0, borderLeftColor: tint }, style]}>
      {children}
    </View>
  );
}

export function Row({ children, style, gap = SPACE.sm, wrap }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean }>) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

/** Recipes always say where they came from. 'demo' and 'rules' are never dressed up as the chef. */
export function SourceBadge({ source, offline }: { source: 'ai' | 'rules' | 'demo'; offline?: boolean }) {
  const t = useTheme();
  const text = source === 'ai' ? 'AI Chef' : source === 'demo' ? 'Sample Recipe' : offline ? 'Basic Plan (Offline)' : 'Basic Plan (No AI)';
  const color = source === 'ai' ? t.accent : t.muted;
  return (
    <View style={{ alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1.5, borderColor: color, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Label color={color}>{text}</Label>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderRadius: radius.pill, padding: 4 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => { haptic.tick(); onChange(option.value); }}
            style={{ flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.raised : 'transparent' }}
          >
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: active ? t.text : t.muted }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min, max, step = 1, format }: { value: number; onChange: (value: number) => void; min: number; max: number; step?: number; format?: (value: number) => string }) {
  const t = useTheme();
  const bump = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) { haptic.tick(); onChange(next); }
  };
  const Knob = ({ glyph, onPress, disabled }: { glyph: string; onPress: () => void; disabled: boolean }) => (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={{ width: touch.min, height: touch.min, borderRadius: radius.pill, backgroundColor: t.raised, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}>
      <Text style={{ fontFamily: font.display, fontSize: 26, color: t.text }}>{glyph}</Text>
    </Pressable>
  );
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Knob glyph="−" onPress={() => bump(-step)} disabled={value <= min} />
      <Text style={{ fontFamily: font.display, fontSize: 28, color: t.text }}>{format ? format(value) : value}</Text>
      <Knob glyph="+" onPress={() => bump(step)} disabled={value >= max} />
    </Row>
  );
}

export const styles = StyleSheet.create({
  fill: { flex: 1 },
});
