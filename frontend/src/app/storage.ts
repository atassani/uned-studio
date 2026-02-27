import { AppLanguage, normalizeLanguage } from './i18n/config';

const LOCAL_STORAGE_KEY = 'learningStudio';
export const LEARNING_STUDIO_STATE_CHANGED_EVENT = 'learning-studio-state-changed';

type QuizStatus = { [key: number]: 'correct' | 'fail' | 'pending' };
interface AreaState {
  currentQuestion: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  quizStatus: QuizStatus;
  selectedSections: string[];
  selectedQuestions: number[];
}

interface UserAreaConfig {
  allowedAreaShortNames: string[];
}

function normalizeAllowedAreaShortNames(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const filtered = input.filter((value): value is string => typeof value === 'string');
  return Array.from(new Set(filtered));
}

function normalizeUserAreaConfig(input: unknown): UserAreaConfig | undefined {
  if (Array.isArray(input)) {
    const normalized = normalizeAllowedAreaShortNames(input);
    return normalized.length > 0 ? { allowedAreaShortNames: normalized } : undefined;
  }

  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const allowed = normalizeAllowedAreaShortNames(
    (input as { allowedAreaShortNames?: unknown }).allowedAreaShortNames
  );
  return allowed.length > 0 ? { allowedAreaShortNames: allowed } : undefined;
}

function normalizeAreaConfigByUser(input: unknown): AppState['areaConfigByUser'] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const normalizedEntries = Object.entries(input).map(
    ([userKey, config]) => [userKey, normalizeUserAreaConfig(config)] as const
  );

  const filtered = normalizedEntries.filter(([, config]) => Boolean(config));
  if (filtered.length === 0) {
    return undefined;
  }

  return Object.fromEntries(filtered);
}

function normalizeAppState(input: unknown): AppState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { areas: {} };
  }

  const obj = input as Partial<AppState>;
  return {
    language: typeof obj.language === 'string' ? normalizeLanguage(obj.language) : undefined,
    currentArea: typeof obj.currentArea === 'string' ? obj.currentArea : undefined,
    areas: obj.areas && typeof obj.areas === 'object' ? obj.areas : {},
    areaConfigByUser: normalizeAreaConfigByUser(obj.areaConfigByUser),
  };
}
export interface AppState {
  language?: AppLanguage;
  currentArea?: string;
  areas: {
    [areaKey: string]: Partial<AreaState>;
  };
  areaConfigByUser?: {
    [userKey: string]: UserAreaConfig | undefined;
  };
}

export const storage = {
  getLanguage(): AppLanguage | undefined {
    return getStoredState().language;
  },

  setLanguage(language: AppLanguage | undefined) {
    const state = getStoredState();
    setStoredState({
      ...state,
      language: language ? normalizeLanguage(language) : undefined,
    });
  },

  getCurrentArea(): string | undefined {
    return getStoredState().currentArea;
  },

  setCurrentArea(areaKey: string | undefined) {
    const state = getStoredState();
    setStoredState({ ...state, currentArea: areaKey });
  },

  setAreaCurrentQuestion(areaKey: string, questionIndex?: number) {
    updateAreaState(areaKey, { currentQuestion: questionIndex });
  },

  getAreaCurrentQuestion(areaKey: string): number | undefined {
    const areaState = getAreaState(areaKey);
    return areaState.currentQuestion;
  },

  setAreaShuffleQuestions(areaKey: string, shuffle: boolean) {
    updateAreaState(areaKey, { shuffleQuestions: shuffle });
  },

  getAreaShuffleQuestions(areaKey: string): boolean | undefined {
    const areaState = getAreaState(areaKey);
    return areaState.shuffleQuestions;
  },

  setAreaShuffleAnswers(areaKey: string, shuffle: boolean) {
    updateAreaState(areaKey, { shuffleAnswers: shuffle });
  },

  getAreaShuffleAnswers(areaKey: string): boolean | undefined {
    const areaState = getAreaState(areaKey);
    return areaState.shuffleAnswers;
  },

  setAreaQuizStatus(areaKey: string, status?: QuizStatus) {
    updateAreaState(areaKey, { quizStatus: status });
  },

  getAreaQuizStatus(areaKey: string): QuizStatus | undefined {
    const areaState = getAreaState(areaKey);
    return areaState.quizStatus;
  },

  setAreaSelectedSections(areaKey: string, sections?: string[]) {
    updateAreaState(areaKey, { selectedSections: sections });
  },

  getAreaSelectedSections(areaKey: string): string[] | undefined {
    const areaState = getAreaState(areaKey);
    return areaState.selectedSections;
  },

  setAreaSelectedQuestions(areaKey: string, questions?: number[]) {
    updateAreaState(areaKey, { selectedQuestions: questions });
  },

  getAreaSelectedQuestions(areaKey: string): number[] | undefined {
    const areaState = getAreaState(areaKey);
    return areaState.selectedQuestions;
  },

  setUserAllowedAreas(userKey: string, allowedAreaShortNames: string[]) {
    const state = getStoredState();
    const existingConfigByUser = state.areaConfigByUser || {};
    const deduped = Array.from(new Set(allowedAreaShortNames));
    setStoredState({
      ...state,
      areaConfigByUser: {
        ...existingConfigByUser,
        [userKey]: {
          allowedAreaShortNames: deduped,
        },
      },
    });
  },

  getUserAllowedAreas(userKey: string): string[] | undefined {
    const state = getStoredState();
    return state.areaConfigByUser?.[userKey]?.allowedAreaShortNames;
  },
  getStateSnapshot: getStoredState,
  replaceState: setStoredState,
  clearState,
  clearAreaState,
};

function getStoredState(): AppState {
  if (typeof window === 'undefined') {
    return { areas: {} };
  }
  try {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      return normalizeAppState(JSON.parse(savedState));
    }
  } catch (e) {
    console.error('Failed to parse state from localStorage', e);
  }
  return { areas: {} };
}

function setStoredState(state: AppState) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const normalizedState = normalizeAppState(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizedState));
    dispatchStateChanged(normalizedState);
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

function getAreaState(areaKey: string): Partial<AreaState> {
  const state = getStoredState();
  return state.areas[areaKey] || {};
}

function updateAreaState(areaKey: string, newAreaState: Partial<AreaState>) {
  const state = getStoredState();
  const updatedState = {
    ...state,
    areas: {
      ...state.areas,
      [areaKey]: {
        ...(state.areas[areaKey] || {}),
        ...newAreaState,
      },
    },
  };
  setStoredState(updatedState);
}

function clearState() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  dispatchStateChanged({ areas: {} });
}

function clearAreaState(areaKey: string) {
  const state = getStoredState();
  if (state.areas[areaKey]) {
    delete state.areas[areaKey];
    setStoredState(state);
  }
}

function dispatchStateChanged(state: AppState) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(LEARNING_STUDIO_STATE_CHANGED_EVENT, {
      detail: state,
    })
  );
}
