import { storage } from '../../src/app/storage';

describe('localStorage abstraction', () => {
  it('write currentArea using storage module is read directly from localStorage', () => {
    const area = 'Area 42';
    storage.setCurrentArea(area);
    const storedState = localStorage.getItem('unedStudio');
    expect(storedState).toContain(`"currentArea":"${area}"`);
    expect(JSON.parse(storedState || '{}').currentArea).toBe(area);
  });

  it('write currentArea directly to localStorage is read by storage module', () => {
    const stateToStore = { currentArea: 'Area 51', areas: {} };
    localStorage.setItem('unedStudio', JSON.stringify(stateToStore));
    const currentArea = storage.getCurrentArea();
    expect(currentArea).toBe('Area 51');
  });
});
