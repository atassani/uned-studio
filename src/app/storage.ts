// src/app/services/storage.ts

type Storable = object | string | number | boolean | null;

///  vvvvvvvvv
const LOCAL_STORAGE_KEY = 'unedStudio';

type QuizStatus = { [key: number]: 'correct' | 'fail' | 'pending' };

interface AreaState {
  currentQuestion: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  quizStatus: QuizStatus;
  selectedSections: string[];
  selectedQuestions: number[];
}

interface AppState {
  currentArea?: string;
  areas: {
    [areaKey: string]: Partial<AreaState>;
  };
}

///  ^^^^^^^^^

export const storage = {
  get<T = unknown>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // fallback for legacy string values
      return raw as unknown as T;
    }
  },

  set(key: string, value: Storable): void {
    if (typeof window === 'undefined') return;
    if (value === undefined) return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },

  getStoredState(): AppState {
    if (typeof window === 'undefined') {
      return { areas: {} };
    }
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error('Failed to parse state from localStorage', e);
    }
    return { areas: {} };
  },

  setStoredState(state: AppState) {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  },

  getAreaState(areaKey: string): Partial<AreaState> {
    const state = this.getStoredState();
    return state.areas[areaKey] || {};
  },

  updateAreaState(areaKey: string, newAreaState: Partial<AreaState>) {
    const state = this.getStoredState();
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
    this.setStoredState(updatedState);
  },

  // inUse. Works
  getCurrentArea(): string | undefined {
    return this.getStoredState().currentArea;
  },

  // inUse. Works
  setCurrentArea(areaKey: string | undefined) {
    const state = this.getStoredState();
    this.setStoredState({ ...state, currentArea: areaKey });
  },

  clearState() {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  clearAreaState(areaKey: string) {
    const state = this.getStoredState();
    if (state.areas[areaKey]) {
      delete state.areas[areaKey];
      this.setStoredState(state);
    }
  },
  ////////////////////////
};
