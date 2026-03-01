import React from 'react';
import LanguageRoutePage, { generateStaticParams } from '../../src/app/[language]/page';

const mockNotFound = jest.fn(() => {
  throw new Error('notFound');
});

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}));

describe('language route page', () => {
  beforeEach(() => {
    mockNotFound.mockClear();
  });

  it('exports static params for supported languages', () => {
    expect(generateStaticParams()).toEqual([
      { language: 'es' },
      { language: 'en' },
      { language: 'ca' },
    ]);
  });

  it('renders redirect component for supported language', () => {
    const rendered = LanguageRoutePage({ params: { language: 'en' } });
    expect(React.isValidElement(rendered)).toBe(true);
    const element = rendered as React.ReactElement<{ language: string }>;
    expect(element.props.language).toBe('en');
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('calls notFound for unsupported language', () => {
    expect(() => LanguageRoutePage({ params: { language: 'fr' } })).toThrow('notFound');
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
