import { formatFirstWithRestCount } from "@/app/utils/string.util";
import { REGIONS } from "@/constants";
import { getDepartementsForRegion } from "@/utils/region.util";

export const buildZoneSummary = (
  departementNumeros: string[]
): string | undefined => {
  const selected = new Set(departementNumeros);
  const completeRegions: string[] = [];
  const looseDepartements: string[] = [];
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
      looseDepartements.push(
        ...selectedInRegion.map((departement) => departement.name)
      );
    }
  }

  const unknownNumeros = departementNumeros.filter(
    (numero) => !knownNumeros.has(numero)
  );

  return formatFirstWithRestCount([
    ...completeRegions.sort((labelA, labelB) => labelA.localeCompare(labelB, "fr")),
    ...looseDepartements.sort((labelA, labelB) =>
      labelA.localeCompare(labelB, "fr")
    ),
    ...unknownNumeros,
  ]);
};
