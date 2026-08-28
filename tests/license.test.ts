import { describe, expect, it } from 'vitest';
import { DAY_MS, hasFreshValidVerdict, verifyUrl } from '../src/lib/license';

describe('license helpers', () => {
  it('encodes license tokens in verification URLs', () => expect(verifyUrl('abc +/?')).toContain('license=abc%20%2B%2F%3F'));
  it('unlocks only a fresh valid cached verdict', () => {
    const now = 2 * DAY_MS;
    expect(hasFreshValidVerdict(JSON.stringify({ valid: true, reason: 'ok', checkedAt: now - 1000 }), now)).toBe(true);
    expect(hasFreshValidVerdict(JSON.stringify({ valid: false, reason: 'revoked', checkedAt: now }), now)).toBe(false);
    expect(hasFreshValidVerdict(JSON.stringify({ valid: true, reason: 'ok', checkedAt: now - DAY_MS - 1 }), now)).toBe(false);
    expect(hasFreshValidVerdict('nope', now)).toBe(false);
  });
});
