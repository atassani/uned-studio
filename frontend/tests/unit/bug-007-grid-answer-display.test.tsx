import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { StatusGrid } from '../../src/app/components/StatusGrid';
import { AreaType, QuestionType } from '../../src/app/types';

describe('StatusGrid overlay BUG-007', () => {
  const mockArea: AreaType = {
    area: 'Test Area',
    file: 'test.json',
    type: 'Multiple Choice',
    shortName: 'TA',
  };

  const mockQuestions: QuestionType[] = [
    {
      index: 0,
      section: 'Section A',
      number: 1,
      question: 'What is 2 + 2?',
      answer: 'One possible answer is 4',
      explanation: 'Basic arithmetic ensures 2 + 2 equals 4.',
      appearsIn: ['Exam 1'],
      options: ['The answer could be 3', 'One possible answer is 4'],
    },
    {
      index: 1,
      section: 'Section A',
      number: 2,
      question: 'Capital of France?',
      answer: 'Paris',
      explanation: 'Paris is the capital of France.',
      appearsIn: ['Exam 1'],
      options: ['Paris', 'Madrid'],
    },
  ];

  it('shows user answer as letter, not full text, when it is a full text string', () => {
    function Wrapper() {
      const [selectedFailedQuestionNumber, setSelectedFailedQuestionNumber] = useState<
        number | null
      >(null);
      return (
        <StatusGrid
          selectedArea={mockArea}
          questions={mockQuestions}
          status={{ 0: 'fail', 1: 'correct' }}
          userAnswers={{ 0: 'The answer could be 3' }} // User answered with the full text '3'
          currentQuizType="Multiple Choice"
          handleContinue={jest.fn()}
          pendingQuestions={jest.fn(() => [] as [number, QuestionType][])}
          resetQuiz={jest.fn()}
          setShowAreaSelection={jest.fn()}
          setShowStatus={jest.fn()}
          setShowResult={jest.fn()}
          originalSectionOrder={['Section A']}
          selectedFailedQuestionNumber={selectedFailedQuestionNumber}
          onOpenFailedQuestion={setSelectedFailedQuestionNumber}
          onCloseFailedQuestion={() => setSelectedFailedQuestionNumber(null)}
        />
      );
    }

    render(<Wrapper />);

    // Click on the failed question
    fireEvent.click(screen.getByText('1❌'));

    // Check that the user's answer is displayed with the letter, not the full text
    const failedAnswerText = screen.getByTestId('failed-answer-text').innerHTML;
    expect(failedAnswerText).toBe('❌ A) The answer could be 3.');
    //expect(screen.getByText('❌ A) The answer could be 3')).toBeInTheDocument();
  });
});
