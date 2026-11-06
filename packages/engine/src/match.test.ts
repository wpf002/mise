import { describe, expect, it } from 'vitest';
import { matchEntry } from './library/match';

describe('matchEntry', () => {
  it('matches labels, ids, and loose names', () => {
    expect(matchEntry('Ground Beef')?.id).toBe('ground-beef');
    expect(matchEntry('chicken-thigh')?.id).toBe('chicken-thigh');
    expect(matchEntry('chicken thighs')?.id).toBe('chicken-thigh');
    expect(matchEntry('a bag of celery')?.id).toBe('celery');
    expect(matchEntry('unicorn horn')).toBeUndefined();
  });
});
