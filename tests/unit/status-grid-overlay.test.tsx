import { render, screen, fireEvent } from '@testing-library/react';
import { StatusGrid } from '../../src/app/components/StatusGrid';
import { AreaType, QuestionType } from '../../src/app/types';

describe('StatusGrid overlay behavior', () => {
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
      answer: '4',
      explanation: 'Basic arithmetic ensures 2 + 2 equals 4.',
      appearsIn: ['Exam 1'],
      options: ['3', '4'],
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

  it('shows and hides the question details overlay when clicking a failed question', () => {
    render(
      <StatusGrid
        selectedArea={mockArea}
        questions={mockQuestions}
        status={{ 0: 'fail', 1: 'correct' }}
        userAnswers={{ 0: 'a', 1: 'a' }}
        currentQuizType="Multiple Choice"
        handleContinue={jest.fn()}
        pendingQuestions={jest.fn(() => [] as [number, QuestionType][])}
        resetQuiz={jest.fn()}
        setShowAreaSelection={jest.fn()}
        setShowStatus={jest.fn()}
        setShowResult={jest.fn()}
      />
    );

    // Initially, the overlay should not be visible
    expect(screen.queryByText(/Pregunta 1 - Fallada/)).not.toBeInTheDocument();

    // Click on the failed question
    fireEvent.click(screen.getByText('1❌'));

    // Check that the overlay appears with question details
    expect(screen.getByText(/Pregunta 1 - Fallada/)).toBeInTheDocument();
    expect(screen.getByText(/What is 2 \+ 2\?/)).toBeInTheDocument();
    expect(screen.getByText('Basic arithmetic ensures 2 + 2 equals 4.')).toBeInTheDocument();

    // Check that options are shown for MCQ
    expect(screen.getByText('A)')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('B)')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Check user's answer section with red cross emoji (only for MCQ)
    expect(screen.getByText('Tu respuesta:')).toBeInTheDocument();
    expect(screen.getByText('❌ A) 3')).toBeInTheDocument();

    // Close the overlay - click the blue close button at the bottom
    fireEvent.click(screen.getByText('Cerrar'));

    // Check that the overlay is hidden
    expect(screen.queryByText(/Pregunta 1 - Fallada/)).not.toBeInTheDocument();
  });
});
