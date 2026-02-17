import fs from 'fs';
import path from 'path';

const normalizeAreas = (data: unknown): Array<{ file: string; type: string }> => {
  if (Array.isArray(data)) return data as Array<{ file: string; type: string }>;
  if (data && typeof data === 'object' && 'areas' in data) {
    const areas = (data as { areas?: Array<{ file: string; type: string }> }).areas;
    if (Array.isArray(areas)) return areas;
  }
  throw new Error('Invalid areas payload');
};

const normalizeQuestions = (data: unknown): Array<{ answer: string; options: string[] }> => {
  if (Array.isArray(data)) return data as Array<{ answer: string; options: string[] }>;
  if (data && typeof data === 'object' && 'questions' in data) {
    const questions = (data as { questions?: Array<{ answer: string; options: string[] }> })
      .questions;
    if (Array.isArray(questions)) return questions;
  }
  throw new Error('Invalid questions payload');
};

describe('MCQ JSON answer format', () => {
  const areasPath = path.join(__dirname, '../testdata/areas-mcq-tests.json');
  const areas = normalizeAreas(JSON.parse(fs.readFileSync(areasPath, 'utf8')));
  const mcqAreas = areas.filter((area) => area.type === 'Multiple Choice');

  mcqAreas.forEach((area) => {
    test(`${area.file} should use literal answers present in options`, () => {
      const filePath = path.join(__dirname, '../testdata', area.file);
      expect(fs.existsSync(filePath)).toBe(true);
      const questions = normalizeQuestions(JSON.parse(fs.readFileSync(filePath, 'utf8')));
      questions.forEach((q) => {
        // Fail if answer is a single letter (a, b, c, d)
        expect(typeof q.answer).toBe('string');
        expect(q.answer.length).toBeGreaterThan(1);
        // Fail if answer is not in options
        expect(q.options).toContain(q.answer);
      });
    });
  });
});
