import { storage } from '../../src/app/storage';

describe('localStorage abstraction', () => {
  it('write currentArea using storage module is read directly from localStorage', () => {
    const area = 'Area 42';
    storage.setCurrentArea(area);
    const storedState = localStorage.getItem('unedStudio');
    expect(storedState).toContain(`"currentArea":"${area}"`);
    expect(JSON.parse(storedState || '{}').currentArea).toBe(area);
  });

  it('write currentArea directly to localStorage is read by storage module', () => {
    const stateToStore = { currentArea: 'Area 51', areas: {} };
    localStorage.setItem('unedStudio', JSON.stringify(stateToStore));
    const currentArea = storage.getCurrentArea();
    expect(currentArea).toBe('Area 51');
  });

  it('write area currentQuestion using storage module is read directly from localStorage', () => {
    const theArea = 'the-area';
    const theCurrentQuestion = 3;
    storage.setAreaCurrentQuestion(theArea, theCurrentQuestion);
    const storedState = localStorage.getItem('unedStudio');
    const areasFromState = JSON.parse(storedState || '{}').areas;
    const theAreaFromState = areasFromState ? areasFromState[theArea] : null;
    expect(theAreaFromState.currentQuestion).toBe(theCurrentQuestion);
  });

  it('write area currentQuestion directly to localStorage is read by storage module', () => {
    const stateToStore = {
      currentArea: 'the-area',
      areas: { ['the-area']: { currentQuestion: 3 } },
    };
    localStorage.setItem('unedStudio', JSON.stringify(stateToStore));
    const currentQuestion = storage.getAreaCurrentQuestion('the-area');
    expect(currentQuestion).toBe(3);
  });

  it('write area shuffleQuestions using storage module is read directly from localStorage', () => {
    const theArea = 'the-area';
    const theShuffleQuestions = true;
    storage.setAreaShuffleQuestions(theArea, theShuffleQuestions);
    const storedState = localStorage.getItem('unedStudio');
    const areasFromState = JSON.parse(storedState || '{}').areas;
    const theAreaFromState = areasFromState ? areasFromState[theArea] : null;
    expect(theAreaFromState.shuffleQuestions).toBe(theShuffleQuestions);
  });

  it('write area shuffleQuestions directly to localStorage is read by storage module', () => {
    const stateToStore = {
      currentArea: 'the-area',
      areas: { ['the-area']: { shuffleQuestions: true } },
    };
    localStorage.setItem('unedStudio', JSON.stringify(stateToStore));
    const shuffleQuestions = storage.getAreaShuffleQuestions('the-area');
    expect(shuffleQuestions).toBe(true);
  });

  it('write area quizStatus using storage module is read directly from localStorage', () => {
    const theArea = 'the-area';
    const theQuizStatus = { 0: 'correct', 1: 'fail' } as const;
    storage.setAreaQuizStatus(theArea, theQuizStatus);
    const storedState = localStorage.getItem('unedStudio');
    const areasFromState = JSON.parse(storedState || '{}').areas;
    const theAreaFromState = areasFromState ? areasFromState[theArea] : null;
    expect(theAreaFromState.quizStatus).toEqual(theQuizStatus);
  });

  it('write area quizStatus directly to localStorage is read by storage module', () => {
    const theQuizStatus = { 0: 'correct', 1: 'fail' } as const;
    const stateToStore = {
      currentArea: 'the-area',
      areas: { ['the-area']: { quizStatus: theQuizStatus } },
    };
    localStorage.setItem('unedStudio', JSON.stringify(stateToStore));
    const quizStatus = storage.getAreaQuizStatus('the-area');
    expect(quizStatus).toEqual(theQuizStatus);
  });
});
