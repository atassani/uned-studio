import { AreaType } from './types';

interface AreaConfigDecisionInput {
  isAuthenticated: boolean;
  isGuest: boolean;
  configuredShortNames?: string[];
  catalogAreas: AreaType[];
}

export function sanitizeConfiguredAreaShortNames(
  configuredShortNames: string[] | undefined,
  catalogAreas: AreaType[]
): string[] {
  if (!configuredShortNames) {
    return [];
  }

  const validAreaSet = new Set(catalogAreas.map((area) => area.shortName));
  const deduped = Array.from(new Set(configuredShortNames));
  return deduped.filter((shortName) => validAreaSet.has(shortName));
}

export function orderAreasByConfiguredShortNames(
  catalogAreas: AreaType[],
  configuredShortNames: string[]
): AreaType[] {
  const byShortName = new Map(catalogAreas.map((area) => [area.shortName, area]));
  return configuredShortNames
    .map((shortName) => byShortName.get(shortName))
    .filter((area): area is AreaType => Boolean(area));
}

export function shouldForceAreaConfiguration({
  isAuthenticated,
  isGuest,
  configuredShortNames,
  catalogAreas,
}: AreaConfigDecisionInput): boolean {
  if (!isAuthenticated || isGuest) {
    return false;
  }

  if (!configuredShortNames) {
    return true;
  }

  return sanitizeConfiguredAreaShortNames(configuredShortNames, catalogAreas).length === 0;
}
