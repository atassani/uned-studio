'use client';

import type { AppState } from './storage';

interface LearningStateResponse {
  scope: string;
  state: AppState;
  updatedAt: string;
}

export async function getLearningState(scope = 'global'): Promise<LearningStateResponse | null> {
  const response = await fetch(`/studio/learning-state/?scope=${encodeURIComponent(scope)}`, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch learning state: ${response.status}`);
  }

  return (await response.json()) as LearningStateResponse;
}

export async function putLearningState(
  state: AppState,
  scope = 'global',
  clientUpdatedAt?: string
): Promise<void> {
  const response = await fetch(`/studio/learning-state/?scope=${encodeURIComponent(scope)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      state,
      clientUpdatedAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to persist learning state: ${response.status}`);
  }
}
