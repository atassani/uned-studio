import { fireEvent, render, screen, within } from '@testing-library/react';
import { AreaConfiguration } from '../../src/app/components/AreaConfiguration';
import { AreaType } from '../../src/app/types';

const areas: AreaType[] = [
  { area: 'IPC', file: 'ipc.json', type: 'Multiple Choice', shortName: 'ipc' },
  { area: 'FDL', file: 'fdl.json', type: 'Multiple Choice', shortName: 'fdl' },
  { area: 'LOG1', file: 'log1.json', type: 'True False', shortName: 'log1' },
];

describe('AreaConfiguration', () => {
  it('submits selected areas in order', () => {
    const onAccept = jest.fn();

    render(
      <AreaConfiguration
        areas={areas}
        initialSelectedShortNames={['fdl', 'ipc']}
        onAccept={onAccept}
        allowCancel={false}
      />
    );

    fireEvent.click(screen.getByLabelText('Subir IPC'));
    fireEvent.click(screen.getByTestId('area-config-accept'));

    expect(onAccept).toHaveBeenCalledWith(['ipc', 'fdl']);
  });

  it('shows validation error when trying to accept an empty selection', () => {
    const onAccept = jest.fn();

    render(
      <AreaConfiguration
        areas={areas}
        initialSelectedShortNames={['ipc']}
        onAccept={onAccept}
        allowCancel={false}
      />
    );

    fireEvent.click(screen.getByLabelText('Quitar IPC'));
    fireEvent.click(screen.getByTestId('area-config-accept'));

    expect(screen.getByTestId('area-config-empty-error')).toBeInTheDocument();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('adds an available area to selected list', () => {
    render(
      <AreaConfiguration
        areas={areas}
        initialSelectedShortNames={['ipc']}
        onAccept={jest.fn()}
        allowCancel={false}
      />
    );

    fireEvent.click(screen.getByLabelText('Agregar FDL'));

    const selectedList = screen.getByTestId('selected-areas-list');
    expect(within(selectedList).getByLabelText('Quitar FDL')).toBeInTheDocument();
  });
});
