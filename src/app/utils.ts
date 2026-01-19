import DOMPurify from 'isomorphic-dompurify';
import { QuestionType } from './types';

export function groupBySection(questions: QuestionType[]): Map<string, QuestionType[]> {
  const map = new Map<string, QuestionType[]>();
  for (const q of questions) {
    if (!map.has(q.section)) map.set(q.section, []);
    map.get(q.section)!.push(q);
  }

  // Sort questions within each section by their number
  for (const [section, qs] of map.entries()) {
    map.set(
      section,
      qs.sort((a, b) => a.number - b.number)
    );
  }
  return map;
}

export function formatRichText(text?: string): { __html: string } {
  if (!text) return { __html: '' };
  const withLineBreaks = text.replace(/\n/g, '<br>');
  const sanitized = DOMPurify.sanitize(withLineBreaks, {
    ADD_TAGS: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'br'],
    ADD_ATTR: ['colspan', 'rowspan', 'style'],
  });
  return { __html: sanitized };
}
