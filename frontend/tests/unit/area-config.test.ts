import {
  orderAreasByConfiguredShortNames,
  sanitizeConfiguredAreaShortNames,
  shouldForceAreaConfiguration,
} from '../../src/app/areaConfig';
import { AreaType } from '../../src/app/types';

const catalogAreas: AreaType[] = [
  { area: 'IPC', file: 'ipc.json', type: 'Multiple Choice', shortName: 'ipc' },
  { area: 'FDL', file: 'fdl.json', type: 'Multiple Choice', shortName: 'fdl' },
  { area: 'LOG1', file: 'log1.json', type: 'True False', shortName: 'log1' },
];

describe('area config utilities', () => {
  it('sanitizes short names by removing invalid and duplicate entries', () => {
    const result = sanitizeConfiguredAreaShortNames(['ipc', 'bad', 'fdl', 'ipc'], catalogAreas);
    expect(result).toEqual(['ipc', 'fdl']);
  });

  it('orders areas according to configured short names', () => {
    const result = orderAreasByConfiguredShortNames(catalogAreas, ['fdl', 'ipc']);
    expect(result.map((area) => area.shortName)).toEqual(['fdl', 'ipc']);
  });

  it('forces configuration for authenticated non-guest users without saved config', () => {
    const force = shouldForceAreaConfiguration({
      isAuthenticated: true,
      isGuest: false,
      configuredShortNames: undefined,
      catalogAreas,
    });
    expect(force).toBe(true);
  });

  it('does not force configuration for guest users', () => {
    const force = shouldForceAreaConfiguration({
      isAuthenticated: true,
      isGuest: true,
      configuredShortNames: undefined,
      catalogAreas,
    });
    expect(force).toBe(false);
  });

  it('forces configuration when persisted config becomes empty after sanitization', () => {
    const force = shouldForceAreaConfiguration({
      isAuthenticated: true,
      isGuest: false,
      configuredShortNames: ['unknown-area'],
      catalogAreas,
    });
    expect(force).toBe(true);
  });

  it('does not force configuration when user has learning history but no saved config', () => {
    const force = shouldForceAreaConfiguration({
      isAuthenticated: true,
      isGuest: false,
      configuredShortNames: undefined,
      catalogAreas,
      hasExistingLearningState: true,
    });
    expect(force).toBe(false);
  });

  it('does not force configuration when saved config is invalid but user has learning history', () => {
    const force = shouldForceAreaConfiguration({
      isAuthenticated: true,
      isGuest: false,
      configuredShortNames: ['unknown-area'],
      catalogAreas,
      hasExistingLearningState: true,
    });
    expect(force).toBe(false);
  });
});
