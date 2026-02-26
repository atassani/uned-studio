'use client';

import type { AppState } from './storage';
import {
  consumeDynamoDbCallAllowance,
  isRemoteLearningStateReadEnabled,
  isRemoteLearningStateWriteEnabled,
  logDynamoDbCall,
} from './persistenceMode';

interface LearningStateResponse {
  scope: string;
  state: AppState;
  updatedAt: string;
}

function getLearningStateEndpoint(scope: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `/api/learning-state?scope=${encodeURIComponent(scope)}`;
  }
  return `/studio/learning-state/?scope=${encodeURIComponent(scope)}`;
}

function normalizeLearningState(input: unknown): AppState {
  let candidate: unknown = input;

  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return { areas: {} };
    }
  }

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { areas: {} };
  }

  const obj = candidate as Partial<AppState>;
  return {
    currentArea: typeof obj.currentArea === 'string' ? obj.currentArea : undefined,
    areas: obj.areas && typeof obj.areas === 'object' ? obj.areas : {},
    areaConfigByUser:
      obj.areaConfigByUser && typeof obj.areaConfigByUser === 'object'
        ? obj.areaConfigByUser
        : undefined,
  };
}

function buildAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') {
    return {};
  }
  const jwt = window.localStorage.getItem('jwt');
  if (!jwt) {
    return {};
  }
  return {
    Authorization: `Bearer ${jwt}`,
  };
}

export async function getLearningState(scope = 'global'): Promise<LearningStateResponse | null> {
  if (!isRemoteLearningStateReadEnabled()) {
    return null;
  }
  if (!consumeDynamoDbCallAllowance('GET', scope)) {
    return null;
  }
  logDynamoDbCall('GET', scope, 'attempt');

  const response = await fetch(getLearningStateEndpoint(scope), {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: buildAuthHeader(),
  });

  if (response.status === 404) {
    logDynamoDbCall('GET', scope, 'error');
    return null;
  }
  if (!response.ok) {
    logDynamoDbCall('GET', scope, 'error');
    throw new Error(`Failed to fetch learning state: ${response.status}`);
  }

  const payload = (await response.json()) as {
    scope?: string;
    state?: unknown;
    updatedAt?: string;
  };

  const normalized = {
    scope: typeof payload.scope === 'string' ? payload.scope : scope,
    state: normalizeLearningState(payload.state),
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : '',
  };
  logDynamoDbCall('GET', scope, 'success');
  return normalized;
}

export async function putLearningState(
  state: AppState,
  scope = 'global',
  clientUpdatedAt?: string
): Promise<void> {
  if (!isRemoteLearningStateWriteEnabled()) {
    return;
  }
  if (!consumeDynamoDbCallAllowance('PUT', scope)) {
    return;
  }
  logDynamoDbCall('PUT', scope, 'attempt');

  const response = await fetch(getLearningStateEndpoint(scope), {
    method: 'PUT',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeader(),
    },
    body: JSON.stringify({
      state,
      clientUpdatedAt,
    }),
  });

  if (!response.ok) {
    logDynamoDbCall('PUT', scope, 'error');
    throw new Error(`Failed to persist learning state: ${response.status}`);
  }
  logDynamoDbCall('PUT', scope, 'success');
}
