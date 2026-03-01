import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { LanguageRouteRedirect } from '../../src/app/components/LanguageRouteRedirect';

const mockSetRouteLanguageOverride = jest.fn();
const mockSetLanguage = jest.fn();

jest.mock('../../src/app/storage', () => ({
  storage: {
    setRouteLanguageOverride: (...args: unknown[]) => mockSetRouteLanguageOverride(...args),
    setLanguage: (...args: unknown[]) => mockSetLanguage(...args),
  },
}));

describe('LanguageRouteRedirect', () => {
  beforeEach(() => {
    mockSetRouteLanguageOverride.mockClear();
    mockSetLanguage.mockClear();
  });

  it('stores override and redirects to studio root', async () => {
    render(<LanguageRouteRedirect language="ca" />);

    await waitFor(() => {
      expect(mockSetRouteLanguageOverride).toHaveBeenCalledWith('ca');
      expect(mockSetLanguage).toHaveBeenCalledWith('ca');
    });
  });
});
