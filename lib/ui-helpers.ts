import { TARGETS } from './constants';

/**
 * Returns the display label for a target index.
 * Guards against out-of-bounds access when targetIndex === TARGETS.length
 * (player finished — applyHit sets this when the Bull is hit).
 */
export function getTargetLabel(targetIndex: number): string {
  if (targetIndex >= TARGETS.length) return 'Klaar';
  return String(TARGETS[targetIndex]);
}
