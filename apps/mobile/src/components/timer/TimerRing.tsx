import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Text, View } from 'react-native';
import { formatClock } from '../../lib/time';
import { font } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

const STROKE = 14;
const WARN_SHARE = 0.2;

export function TimerRing({ remainingMs, durationMs, size = 240, paused }: { remainingMs: number; durationMs: number; size?: number; paused?: boolean }) {
  const t = useTheme();
  const share = durationMs > 0 ? Math.min(1, Math.max(0, remainingMs / durationMs)) : 0;
  const radius = size / 2 - STROKE;
  const path = Skia.PathBuilder.Make().addCircle(size / 2, size / 2, radius).build();
  const color = share <= WARN_SHARE ? t.primary : t.accent;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
        <Path path={path} color={t.surface} style="stroke" strokeWidth={STROKE} />
        <Path path={path} color={color} style="stroke" strokeWidth={STROKE} strokeCap="round" start={0} end={share} />
      </Canvas>
      <Text style={{ fontFamily: font.display, fontSize: size / 4, color: t.text, fontVariant: ['tabular-nums'] }}>{formatClock(remainingMs)}</Text>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: paused ? t.accent : t.muted }}>{paused ? 'Paused' : 'Left'}</Text>
    </View>
  );
}
