import { fireEvent, render, screen } from '@testing-library/react';
import { AreaSelection } from '../../src/app/components/AreaSelection';
import { AreaType } from '../../src/app/types';

const areas: AreaType[] = [
  { area: 'IPC', file: 'ipc.json', type: 'Multiple Choice', shortName: 'ipc' },
];

describe('AreaSelection language selector', () => {
  it('hides language selector when disabled', () => {
    render(
      <AreaSelection
        areas={areas}
        loadAreaAndQuestions={jest.fn()}
        languageSelectionEnabled={false}
        activeLanguage="es"
        onLanguageChange={jest.fn()}
      />
    );

    expect(screen.queryByTestId('language-selector')).not.toBeInTheDocument();
  });

  it('shows language selector when enabled', () => {
    render(
      <AreaSelection
        areas={areas}
        loadAreaAndQuestions={jest.fn()}
        languageSelectionEnabled={true}
        activeLanguage="es"
        onLanguageChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
  });

  it('calls onLanguageChange with selected value', () => {
    const onLanguageChange = jest.fn();

    render(
      <AreaSelection
        areas={areas}
        loadAreaAndQuestions={jest.fn()}
        languageSelectionEnabled={true}
        activeLanguage="es"
        onLanguageChange={onLanguageChange}
      />
    );

    fireEvent.change(screen.getByTestId('language-selector'), { target: { value: 'ca' } });
    expect(onLanguageChange).toHaveBeenCalledWith('ca');
  });
});
