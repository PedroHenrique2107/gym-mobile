import { describe, expect, it } from 'vitest';

import { formatElapsed, formatSeconds } from './training-session';

describe('training session timers', () => {
  it('formats elapsed time and never returns a negative duration', () => {
    const startedAt = '2026-08-09T12:00:00.000Z';

    expect(formatElapsed(startedAt, Date.parse('2026-08-09T13:02:03.000Z'))).toBe('01:02:03');
    expect(formatElapsed(startedAt, Date.parse('2026-08-09T11:59:59.000Z'))).toBe('00:00:00');
  });

  it('formats a rest countdown as minutes and seconds', () => {
    expect(formatSeconds(0)).toBe('0:00');
    expect(formatSeconds(95)).toBe('1:35');
  });
});
