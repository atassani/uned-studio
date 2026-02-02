const LOCAL_STORAGE_KEY = 'learningStudio';

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

export const storage = {
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
      return JSON.parse(savedState);
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
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
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
}

function clearAreaState(areaKey: string) {
  const state = getStoredState();
  if (state.areas[areaKey]) {
    delete state.areas[areaKey];
    setStoredState(state);
  }
}
