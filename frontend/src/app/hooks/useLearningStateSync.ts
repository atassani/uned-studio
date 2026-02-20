'use client';

import { useEffect, useRef } from 'react';
import { AppState, LEARNING_STUDIO_STATE_CHANGED_EVENT, storage } from '../storage';
import { getLearningState, putLearningState } from '../learningStateApi';

interface UseLearningStateSyncOptions {
  enabled: boolean;
  onServerStateApplied?: () => void;
}

export function useLearningStateSync({
  enabled,
  onServerStateApplied,
}: UseLearningStateSyncOptions) {
  const initializedRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const suppressNextSyncRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onServerStateAppliedRef = useRef(onServerStateApplied);

  useEffect(() => {
    onServerStateAppliedRef.current = onServerStateApplied;
  }, [onServerStateApplied]);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      initializedRef.current = false;
      bootstrappedRef.current = false;
      return () => {
        cancelled = true;
      };
    }

    if (bootstrappedRef.current) {
      return () => {
        cancelled = true;
      };
    }
    bootstrappedRef.current = true;

    const bootstrap = async () => {
      try {
        const localState = storage.getStateSnapshot();
        const remote = await getLearningState('global');
        if (cancelled) {
          return;
        }

        if (remote?.state) {
          suppressNextSyncRef.current = true;
          storage.replaceState(remote.state);
          onServerStateAppliedRef.current?.();
        } else if (hasLocalProgress(localState)) {
          await putLearningState(localState, 'global', new Date().toISOString());
        }
      } catch (error) {
        console.error('Failed to bootstrap learning state sync', error);
      } finally {
        initializedRef.current = true;
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const queueSave = (state: AppState) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        if (!initializedRef.current) {
          return;
        }
        try {
          await putLearningState(state, 'global', new Date().toISOString());
        } catch (error) {
          console.error('Failed to sync learning state', error);
        }
      }, 800);
    };

    const onStateChanged = (event: Event) => {
      if (suppressNextSyncRef.current) {
        suppressNextSyncRef.current = false;
        return;
      }
      const customEvent = event as CustomEvent<AppState>;
      const state = customEvent.detail ?? storage.getStateSnapshot();
      queueSave(state);
    };

    window.addEventListener(LEARNING_STUDIO_STATE_CHANGED_EVENT, onStateChanged);

    return () => {
      window.removeEventListener(LEARNING_STUDIO_STATE_CHANGED_EVENT, onStateChanged);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [enabled]);
}

function hasLocalProgress(state: AppState): boolean {
  if (state.currentArea) {
    return true;
  }
  return Object.keys(state.areas ?? {}).length > 0;
}
