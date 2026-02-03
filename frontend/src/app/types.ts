export interface QuestionType {
  index: number;
  section: string;
  number: number;
  question: string;
  answer: string;
  explanation: string;
  options?: string[]; // For multiple choice questions
  appearsIn?: string[];
}

export interface AreaType {
  area: string;
  file: string;
  type: 'True False' | 'Multiple Choice';
  shortName: string;
}
