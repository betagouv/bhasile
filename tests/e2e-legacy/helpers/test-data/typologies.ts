import { getTypePlacesYearRange } from "@/app/utils/date.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

import { TestStructureData } from "./types";

type StructureTypologieFixture =
  TestStructureData["structureTypologies"][number];

export const mirrorVersionedPlaces = (
  typologies: StructureTypologieFixture[]
): StructureTypologieFixture[] => {
  const { years } = getTypePlacesYearRange();
  const legacyIndex = years.indexOf(PLACES_VERSIONED_FROM_YEAR - 1);

  if (legacyIndex === -1) {
    return typologies;
  }

  const legacyPlacesAutorisees = typologies[legacyIndex]?.placesAutorisees;

  return typologies.map((typologie, index) =>
    index < legacyIndex
      ? { ...typologie, placesAutorisees: legacyPlacesAutorisees }
      : typologie
  );
};
