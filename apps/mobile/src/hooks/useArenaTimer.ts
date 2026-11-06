import { useEffect, useState } from 'react';
import { arenaRemainingMs, type ArenaRun } from '../store/useStore';

const TICK_MS = 250;

/** Remaining ms, derived from timestamps on every tick so backgrounding can't drift it. */
export function useArenaTimer(run: ArenaRun | null): number {
  const [remaining, setRemaining] = useState(() => (run ? arenaRemainingMs(run) : 0));
  useEffect(() => {
    if (!run) return;
    setRemaining(arenaRemainingMs(run));
    const id = setInterval(() => setRemaining(arenaRemainingMs(run)), TICK_MS);
    return () => clearInterval(id);
  }, [run]);
  return remaining;
}
