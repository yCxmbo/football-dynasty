import { describe, expect, it } from 'vitest';
import { aerial, cornerFactor, counterRisk, DEFAULT_ROUTINES, estimateCorners, freeKickFactor } from './routines';

const giants = [{ Heading: 18, 'Jumping Reach': 19, Strength: 18, 'Long Shots': 6 }, { Heading: 17, 'Jumping Reach': 18, Strength: 17, 'Long Shots': 7 }, { Heading: 16, 'Jumping Reach': 17, Strength: 16, 'Long Shots': 8 }];
const shooters = [{ Heading: 7, 'Jumping Reach': 7, Strength: 8, 'Long Shots': 18 }, { Heading: 8, 'Jumping Reach': 8, Strength: 8, 'Long Shots': 17 }];

describe('set-piece routines', () => {
  it('defaults change nothing; routines reward the right players', () => {
    const air = aerial(giants);
    expect(cornerFactor(DEFAULT_ROUTINES, air)).toBe(1);
    expect(freeKickFactor(DEFAULT_ROUTINES, air)).toEqual({ direct: 1, cross: 0 });
    expect(counterRisk(DEFAULT_ROUTINES)).toBe(0);
    expect(cornerFactor({ ...DEFAULT_ROUTINES, corner: 'far' }, air)).toBeGreaterThan(1);
    expect(cornerFactor({ ...DEFAULT_ROUTINES, corner: 'far' }, aerial(shooters))).toBeLessThan(1);
    expect(estimateCorners({ ...DEFAULT_ROUTINES, corner: 'edge' }, 15, shooters)).toBeGreaterThan(estimateCorners({ ...DEFAULT_ROUTINES, corner: 'edge' }, 15, giants));
    expect(cornerFactor({ ...DEFAULT_ROUTINES, bodies: 'more' }, air)).toBeGreaterThan(1);
    expect(counterRisk({ ...DEFAULT_ROUTINES, bodies: 'more' })).toBeGreaterThan(0);
  });
});
