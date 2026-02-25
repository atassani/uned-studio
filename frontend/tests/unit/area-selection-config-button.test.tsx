import { fireEvent, render, screen } from '@testing-library/react';
import { AreaSelection } from '../../src/app/components/AreaSelection';
import { AreaType } from '../../src/app/types';

const areas: AreaType[] = [
  { area: 'IPC', file: 'ipc.json', type: 'Multiple Choice', shortName: 'ipc' },
];

describe('AreaSelection configuration button', () => {
  it('renders configure button for configurable users', () => {
    render(
      <AreaSelection
        areas={areas}
        loadAreaAndQuestions={jest.fn()}
        canConfigureAreas={true}
        onConfigureAreas={jest.fn()}
      />
    );

    expect(screen.getByTestId('configure-areas-button')).toBeInTheDocument();
  });

  it('hides configure button when user cannot configure', () => {
    render(
      <AreaSelection
        areas={areas}
        loadAreaAndQuestions={jest.fn()}
        canConfigureAreas={false}
        onConfigureAreas={jest.fn()}
      />
    );

    expect(screen.queryByTestId('configure-areas-button')).not.toBeInTheDocument();
  });

  it('calls callback when configure button is clicked', () => {
    const onConfigureAreas = jest.fn();

    render(
      <AreaSelection
        areas={areas}
        loadAreaAndQuestions={jest.fn()}
        canConfigureAreas={true}
        onConfigureAreas={onConfigureAreas}
      />
    );

    fireEvent.click(screen.getByTestId('configure-areas-button'));
    expect(onConfigureAreas).toHaveBeenCalledTimes(1);
  });
});
