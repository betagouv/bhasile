import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

import {
  ResolvableVersion,
  resolveCurrentVersion,
} from "../structure-versions/structure-version.util";

export type PlacesResolvableVersion = ResolvableVersion & {
  placesAutorisees: number | null;
};

// Places autorisées au 31 décembre de l'année
export const resolvePlacesAutoriseesForYear = (
  year: number,
  legacyPlacesAutorisees: number | null | undefined,
  versions: PlacesResolvableVersion[],
  now: Date,
  versionedFromYear: number = PLACES_VERSIONED_FROM_YEAR
): number | undefined => {
  if (year < versionedFromYear) {
    return legacyPlacesAutorisees ?? undefined;
  }
  const yearEndUtcMs = Date.UTC(year, 11, 31);
  const referenceDate = new Date(Math.min(yearEndUtcMs, now.getTime()));
  return (
    resolveCurrentVersion(versions, referenceDate)?.placesAutorisees ??
    undefined
  );
};

export const resolveWritablePlacesForYear = (
  year: number,
  placesAutorisees: number | null | undefined,
  versionedFromYear: number = PLACES_VERSIONED_FROM_YEAR
): number | null | undefined =>
  year >= versionedFromYear ? null : placesAutorisees;

export const resolveTypologiesPlacesAutorisees = <
  TTypologie extends { year: number; placesAutorisees: number | null },
>(
  typologies: TTypologie[],
  versions: PlacesResolvableVersion[],
  now: Date
): TTypologie[] =>
  typologies.map((typologie) => ({
    ...typologie,
    placesAutorisees:
      resolvePlacesAutoriseesForYear(
        typologie.year,
        typologie.placesAutorisees,
        versions,
        now
      ) ?? null,
  }));
