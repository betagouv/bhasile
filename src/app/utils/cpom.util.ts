import { CpomFormType } from "@/schemas/forms/base/cpom.schema";

export const getStructureCpomDefaultValues = (
  cpomStructures: CpomFormType["structures"] | undefined
) => {
  if (!cpomStructures) {
    return [];
  }
  return cpomStructures.map((cpomStructure) => ({
    ...cpomStructure,
    cpom: {
      ...cpomStructure.cpom,
      granularity: cpomStructure.cpom?.granularity ?? "REGIONALE",
      region: cpomStructure.cpom?.region ?? undefined,
      departements: cpomStructure.cpom?.departements ?? undefined,
      actesAdministratifs:
        cpomStructure.cpom?.actesAdministratifs?.map((acteAdministratif) => ({
          ...acteAdministratif,
          startDate: acteAdministratif.startDate ?? undefined,
          endDate: acteAdministratif.endDate ?? undefined,
          date: acteAdministratif.date ?? undefined,
        })) ?? [],
    },
  }));
};
