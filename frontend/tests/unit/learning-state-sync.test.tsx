import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useLearningStateSync } from '../../src/app/hooks/useLearningStateSync';
import { LEARNING_STUDIO_STATE_CHANGED_EVENT } from '../../src/app/storage';
import { getLearningState, putLearningState } from '../../src/app/learningStateApi';

jest.mock('../../src/app/learningStateApi', () => ({
  getLearningState: jest.fn(),
  putLearningState: jest.fn(),
}));

function HookHarness({ enabled }: { enabled: boolean }) {
  useLearningStateSync({ enabled });
  return null;
}

describe('useLearningStateSync', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('persists updated language remotely after bootstrap completes', async () => {
    (getLearningState as jest.Mock).mockResolvedValue(null);
    (putLearningState as jest.Mock).mockResolvedValue(undefined);

    render(<HookHarness enabled />);

    await waitFor(() => {
      expect(getLearningState).toHaveBeenCalledWith('global');
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent(LEARNING_STUDIO_STATE_CHANGED_EVENT, {
          detail: {
            areas: {},
            language: 'en',
          },
        })
      );
    });

    act(() => {
      jest.advanceTimersByTime(900);
    });

    await waitFor(() => {
      expect(putLearningState).toHaveBeenCalledTimes(1);
    });

    expect(putLearningState).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en' }),
      'global',
      expect.any(String)
    );
  });
});
