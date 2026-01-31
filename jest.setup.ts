import '@testing-library/jest-dom';

// Silence window.alert not implemented error in jsdom
if (typeof window !== 'undefined') {
  window.alert = window.alert || (() => {});
}

// jest.setup.ts
globalThis.alert = jest.fn();
