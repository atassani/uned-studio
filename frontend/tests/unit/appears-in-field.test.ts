import fs from 'fs';
import path from 'path';

const normalizeAreas = (data: unknown): Array<{ file: string }> => {
  if (Array.isArray(data)) return data as Array<{ file: string }>;
  if (data && typeof data === 'object' && 'areas' in data) {
    const areas = (data as { areas?: Array<{ file: string }> }).areas;
    if (Array.isArray(areas)) return areas;
  }
  throw new Error('Invalid areas payload');
};

const normalizeQuestions = (data: unknown): Array<any> => {
  if (Array.isArray(data)) return data as Array<any>;
  if (data && typeof data === 'object' && 'questions' in data) {
    const questions = (data as { questions?: Array<any> }).questions;
    if (Array.isArray(questions)) return questions;
  }
  throw new Error('Invalid questions payload');
};

// Load all question files referenced in areas.json
const areasPath = path.join(__dirname, '../testdata/areas-mcq-tests.json');
const areas = normalizeAreas(JSON.parse(fs.readFileSync(areasPath, 'utf8')));
const questionFiles = areas.map((area: any) => area.file);

describe('All question files appearsIn field', () => {
  questionFiles.forEach((file: string) => {
    const filePath = path.join(__dirname, '../testdata', file);
    if (!fs.existsSync(filePath)) return;
    const questions: Array<any> = normalizeQuestions(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    const validSections = new Set<string>();
    questions.forEach((q) => {
      if (q.section) validSections.add(q.section);
    });

    test(`${file}: All appearsIn values are valid section or exam names`, () => {
      questions.forEach((q, idx) => {
        if (q.appearsIn) {
          expect(Array.isArray(q.appearsIn)).toBe(true);
          q.appearsIn.forEach((ref: string) => {
            expect(validSections.has(ref)).toBe(true);
          });
        }
      });
    });
  });
});

describe('All question files explanations', () => {
  questionFiles.forEach((file: string) => {
    const filePath = path.join(__dirname, '../testdata', file);
    if (!fs.existsSync(filePath)) return;
    const questions: Array<any> = normalizeQuestions(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    it(`${file}: should fail if any explanation contains a literal section name from the file (regression)`, () => {
      const sectionNames = Array.from(new Set(questions.map((q) => q.section).filter(Boolean)));
      const found = questions.filter((q) => {
        if (typeof q.explanation !== 'string' || !q.explanation.trim()) return false;
        return sectionNames.some((section) => section && q.explanation.includes(section));
      });
      expect(found.length).toBe(0);
    });
  });
});
