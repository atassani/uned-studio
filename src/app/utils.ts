import DOMPurify from 'isomorphic-dompurify';
import { QuestionType } from './types';

// User type for display name function
interface UserForDisplay {
  username?: string;
  attributes?: {
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    [key: string]: any; // Allow for any additional attributes like 'custom:name', 'cognito:name'
  };
  isAnonymous?: boolean;
}

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

/**
 * Utility function to get the user's display name from authentication data.
 * Returns the best available name in the following order of preference:
 * 1. Full name from 'name' attribute (Google OAuth provides this)
 * 2. Combined given_name + family_name
 * 3. Email address
 * 4. Username (only if it doesn't look like a Google ID)
 * 5. 'User' as final fallback
 */
export function getUserDisplayName(user: UserForDisplay | null | undefined): string {
  if (!user) return 'User';

  // Handle anonymous users
  if (user.isAnonymous) {
    return 'Anónimo';
  }

  // Try the 'name' attribute first (Google OAuth provides this)
  if (user.attributes?.name) {
    return user.attributes.name;
  }

  // Try combining given_name and family_name
  const firstName = user.attributes?.given_name;
  const lastName = user.attributes?.family_name;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  // If only one name part is available, use it
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }

  // Try alternative attribute names (legacy support only)

  // Fallback to email
  if (user.attributes?.email) {
    return user.attributes.email;
  }

  // Only use username if it doesn't look like a Google ID (which starts with "Google_")
  if (user.username && !user.username.startsWith('Google_')) {
    return user.username;
  }

  // Final fallback
  return 'User';
}
