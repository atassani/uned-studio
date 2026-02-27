import { AppLanguage, normalizeLanguage } from './i18n/config';
import { AreaType, QuestionType } from './types';

interface RawArea {
  area: string;
  file: string;
  type: 'True False' | 'Multiple Choice';
  shortName: string;
  language?: string;
}

interface AreasObjectPayload {
  areas?: RawArea[];
  guestAllowedAreaShortNames?: unknown;
}

interface QuestionsObjectPayload {
  questions?: QuestionType[];
  language?: unknown;
}

export interface NormalizedAreasPayload {
  areas: Array<AreaType & { language: AppLanguage }>;
  guestAllowedAreaShortNames: string[] | null;
}

export interface NormalizedQuestionsPayload {
  language: AppLanguage;
  questions: QuestionType[];
}

export function normalizeAreasPayload(
  data: unknown,
  activeLanguage: AppLanguage
): NormalizedAreasPayload {
  const guestAllowedAreaShortNames = (() => {
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'guestAllowedAreaShortNames' in data
    ) {
      const raw = (data as AreasObjectPayload).guestAllowedAreaShortNames;
      if (Array.isArray(raw)) {
        return raw.filter((shortName): shortName is string => typeof shortName === 'string');
      }
    }
    return null;
  })();

  const rawAreas: RawArea[] = (() => {
    if (Array.isArray(data)) {
      return data as RawArea[];
    }
    if (data && typeof data === 'object' && 'areas' in data) {
      const areas = (data as AreasObjectPayload).areas;
      if (Array.isArray(areas)) {
        return areas;
      }
    }
    throw new Error('Invalid areas payload');
  })();

  const areas = rawAreas
    .map((area) => ({
      ...area,
      language: normalizeLanguage(area.language),
    }))
    .filter((area) => area.language === activeLanguage);

  return { areas, guestAllowedAreaShortNames };
}

export function normalizeQuestionsPayload(
  data: unknown,
  fallbackLanguage: AppLanguage = 'es'
): NormalizedQuestionsPayload {
  if (Array.isArray(data)) {
    return {
      language: fallbackLanguage,
      questions: data as QuestionType[],
    };
  }

  if (data && typeof data === 'object' && 'questions' in data) {
    const payload = data as QuestionsObjectPayload;
    const questions = payload.questions;
    if (Array.isArray(questions)) {
      const language =
        typeof payload.language === 'string'
          ? normalizeLanguage(payload.language)
          : fallbackLanguage;
      return { language, questions };
    }
  }

  throw new Error('Invalid questions payload');
}
