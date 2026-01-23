import { getUserAnswerDisplay } from '../../src/app/components/StatusGrid';

describe('getUserAnswerDisplay', () => {
  it('returns letter and option text for valid MCQ answer', () => {
    const options = ['Paris', 'London', 'Rome'];
    expect(getUserAnswerDisplay('Paris', options)).toBe('A) Paris.');
    expect(getUserAnswerDisplay('London', options)).toBe('B) London.');
    expect(getUserAnswerDisplay('Rome', options)).toBe('C) Rome.');
  });

  it('returns letter and fallback if index is out of range', () => {
    const options = ['Paris', 'London'];
    expect(getUserAnswerDisplay('z', options)).toBe('Z) z.');
  });

  it('returns empty string if no answer', () => {
    expect(getUserAnswerDisplay('', ['Paris', 'London'])).toBe('');
  });

  it('returns only the literal answer if options are missing', () => {
    expect(getUserAnswerDisplay('answer')).toBe('answer');
  });
});
