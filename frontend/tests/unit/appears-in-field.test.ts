import fs from 'fs';
import path from 'path';

// Load all question files referenced in areas.json
const areasPath = path.join(__dirname, '../../public/areas.json');
const areas = JSON.parse(fs.readFileSync(areasPath, 'utf8'));
const questionFiles = areas.map((area: any) => area.file);

describe('All question files appearsIn field', () => {
  questionFiles.forEach((file: string) => {
    const filePath = path.join(__dirname, '../../public', file);
    if (!fs.existsSync(filePath)) return;
    const questions: Array<any> = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    const filePath = path.join(__dirname, '../../public', file);
    if (!fs.existsSync(filePath)) return;
    const questions: Array<any> = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
