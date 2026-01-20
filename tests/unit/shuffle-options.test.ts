import { shuffleOptionsWithMemory } from '../../src/app/utils';

describe('shuffleOptionsWithMemory', () => {
  it('returns a different order when RNG keeps producing the previous order', () => {
    const options = ['A', 'B', 'C'];
    const previous = ['A', 'B', 'C'];
    const stuckRng = (() => {
      const values = [0.999, 0.999, 0.999];
      let idx = 0;
      return () => values[idx++] ?? 0.999;
    })();

    const result = shuffleOptionsWithMemory(options, previous, stuckRng);
    expect(result).not.toEqual(previous);
    expect([...result].sort()).toEqual([...options].sort());
  });

  it('falls back to a shuffled copy when there is no previous order', () => {
    const options = ['X', 'Y', 'Z'];
    const result = shuffleOptionsWithMemory(options);
    expect(result).toHaveLength(options.length);
    expect([...result].sort()).toEqual([...options].sort());
  });
});
