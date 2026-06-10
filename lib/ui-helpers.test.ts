import { describe, it, expect } from 'vitest';
import { getTargetLabel } from './ui-helpers';
import { TARGETS } from './constants';

describe('getTargetLabel', () => {
  it('returns the target name for each valid index', () => {
    expect(getTargetLabel(0)).toBe('20');
    expect(getTargetLabel(1)).toBe('19');
    expect(getTargetLabel(5)).toBe('15');
    expect(getTargetLabel(6)).toBe('BULL');
  });

  it('never returns "undefined" for index === TARGETS.length (post-win state)', () => {
    const label = getTargetLabel(TARGETS.length); // index 7
    expect(label).not.toBe('undefined');
    expect(label).not.toBe(undefined);
    expect(label.length).toBeGreaterThan(0);
  });

  it('returns "Klaar" for any index past the last target', () => {
    expect(getTargetLabel(TARGETS.length)).toBe('Klaar');
    expect(getTargetLabel(TARGETS.length + 1)).toBe('Klaar');
    expect(getTargetLabel(99)).toBe('Klaar');
  });
});
