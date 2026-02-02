import fs from 'fs';
import path from 'path';

describe('MCQ JSON answer format', () => {
  const areasPath = path.join(__dirname, '../../public/areas.json');
  const areas: Array<{ file: string; type: string }> = JSON.parse(
    fs.readFileSync(areasPath, 'utf8')
  );
  const mcqAreas = areas.filter((area) => area.type === 'Multiple Choice');

  mcqAreas.forEach((area) => {
    test(`${area.file} should use literal answers present in options`, () => {
      const filePath = path.join(__dirname, '../../public', area.file);
      expect(fs.existsSync(filePath)).toBe(true);
      const questions: Array<{ answer: string; options: string[] }> = JSON.parse(
        fs.readFileSync(filePath, 'utf8')
      );
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
