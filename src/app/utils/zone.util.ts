import { formatFirstWithRestCount } from "@/app/utils/string.util";
import { REGIONS } from "@/constants";
import { Departement } from "@/types/departement.type";
import {
  getDepartementNumerosForRegion,
  getDepartementsForRegion,
} from "@/utils/region.util";

const compareLabels = (labelA: string, labelB: string): number =>
  labelA.localeCompare(labelB, "fr");

const groupZoneSelection = (departementNumeros: string[]): ZoneSelection => {
  const selected = new Set(departementNumeros);
  const completeRegions: string[] = [];
  const looseDepartements: Departement[] = [];
  const knownNumeros = new Set<string>();

  for (const region of REGIONS) {
    const regionDepartements = getDepartementsForRegion(region.name);
    const selectedInRegion = regionDepartements.filter((departement) =>
      selected.has(departement.numero)
    );
    if (selectedInRegion.length === 0) {
      continue;
    }
    selectedInRegion.forEach((departement) =>
      knownNumeros.add(departement.numero)
    );

    if (selectedInRegion.length === regionDepartements.length) {
      completeRegions.push(region.name);
    } else {
      looseDepartements.push(...selectedInRegion);
    }
  }

  return {
    completeRegions: completeRegions.sort(compareLabels),
    looseDepartements: looseDepartements.sort((departementA, departementB) =>
      compareLabels(departementA.name, departementB.name)
    ),
    unknownNumeros: departementNumeros.filter(
      (numero) => !knownNumeros.has(numero)
    ),
  };
};

export const buildZoneSummary = (
  departementNumeros: string[]
): string | undefined => {
  const { completeRegions, looseDepartements, unknownNumeros } =
    groupZoneSelection(departementNumeros);

  return formatFirstWithRestCount([
    ...completeRegions,
    ...looseDepartements.map((departement) => departement.name),
    ...unknownNumeros,
  ]);
};

export const reduceToSingleZone = (departementNumeros: string[]): string[] => {
  const { completeRegions, looseDepartements, unknownNumeros } =
    groupZoneSelection(departementNumeros);
  const zoneCount =
    completeRegions.length + looseDepartements.length + unknownNumeros.length;

  if (zoneCount <= 1) {
    return departementNumeros;
  }
  if (completeRegions.length > 0) {
    return getDepartementNumerosForRegion(completeRegions[0]);
  }
  if (looseDepartements.length > 0) {
    return [looseDepartements[0].numero];
  }
  return [];
};

type ZoneSelection = {
  completeRegions: string[];
  looseDepartements: Departement[];
  unknownNumeros: string[];
};
