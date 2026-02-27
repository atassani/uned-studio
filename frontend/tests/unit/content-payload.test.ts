import fs from 'fs';
import path from 'path';
import { normalizeAreasPayload, normalizeQuestionsPayload } from '../../src/app/contentPayload';

describe('content payload normalization', () => {
  it('filters areas by active language', () => {
    const areasPath = path.join(__dirname, '../testdata/areas-multilang-tests.json');
    const areasData = JSON.parse(fs.readFileSync(areasPath, 'utf8'));

    const en = normalizeAreasPayload(areasData, 'en');
    const ca = normalizeAreasPayload(areasData, 'ca');
    const es = normalizeAreasPayload(areasData, 'es');

    expect(en.areas.map((a) => a.shortName)).toEqual(['mcq-tests-en']);
    expect(ca.areas.map((a) => a.shortName)).toEqual(['mcq-tests-ca']);
    expect(es.areas.map((a) => a.shortName)).toEqual(['log1']);
  });

  it('reads question file language and keeps fallback compatibility', () => {
    const enPath = path.join(__dirname, '../testdata/questions-mcq-tests-en.json');
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const enPayload = normalizeQuestionsPayload(enData, 'es');
    expect(enPayload.language).toBe('en');
    expect(enPayload.questions).toHaveLength(1);

    const legacyArrayPayload = normalizeQuestionsPayload([], 'ca');
    expect(legacyArrayPayload.language).toBe('ca');
    expect(legacyArrayPayload.questions).toEqual([]);
  });
});
