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

function arraysEqual<T>(a?: T[], b?: T[]): boolean {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

function hasDistinctValues<T>(arr: T[]): boolean {
  if (arr.length <= 1) return false;
  for (let i = 1; i < arr.length; i++) {
    if (!Object.is(arr[i], arr[0])) {
      return true;
    }
  }
  return false;
}

function fisherYatesShuffle<T>(source: T[], rng: () => number): T[] {
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleOptionsWithMemory<T>(
  options: T[],
  previousOrder?: T[],
  rng: () => number = Math.random
): T[] {
  if (options.length <= 1) {
    return [...options];
  }

  const canChangeOrder = hasDistinctValues(options);
  if (!previousOrder || !canChangeOrder) {
    return fisherYatesShuffle(options, rng);
  }

  let candidate = fisherYatesShuffle(options, rng);
  let attempts = 0;
  const maxAttempts = 5;

  while (arraysEqual(candidate, previousOrder) && attempts < maxAttempts) {
    candidate = fisherYatesShuffle(options, rng);
    attempts += 1;
  }

  if (arraysEqual(candidate, previousOrder)) {
    // Rotate deterministically to guarantee a different order when possible
    return [...candidate.slice(1), candidate[0]];
  }

  return candidate;
}

export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
