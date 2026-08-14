import { REGIONS } from "@/constants";
import { getDepartementsForRegion } from "@/utils/region.util";

export const buildZoneSummary = (
  departementNumeros: string[]
): string | undefined => {
  const selected = new Set(departementNumeros);
  const completeRegions: string[] = [];
  const looseDepartements: string[] = [];

  for (const region of REGIONS) {
    const regionDepartements = getDepartementsForRegion(region.name);
    const selectedInRegion = regionDepartements.filter((departement) =>
      selected.has(departement.numero)
    );
    if (selectedInRegion.length === 0) {
      continue;
    }

    if (selectedInRegion.length === regionDepartements.length) {
      completeRegions.push(region.name);
    } else {
      looseDepartements.push(
        ...selectedInRegion.map((departement) => departement.name)
      );
    }
  }

  const items = [
    ...completeRegions.sort((labelA, labelB) => labelA.localeCompare(labelB, "fr")),
    ...looseDepartements.sort((labelA, labelB) =>
      labelA.localeCompare(labelB, "fr")
    ),
  ];

  const [primary, ...rest] = items;
  if (!primary) {
    return undefined;
  }
  return rest.length > 0 ? `${primary} +${rest.length}` : primary;
};
