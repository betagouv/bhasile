// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToPrismaObject = (initialObject: unknown): any => {
  const arrayNestedFields = [
    "structures",
    "contacts",
    "adresses",
    "adresseTypologies",
    "budgets",
    "indicateursFinanciers",
    "fileUploads",
    "controles",
    "structureTypologies",
    "forms",
    "formSteps",
    "activites",
    "evenementsIndesirablesGraves",
    "evaluations",
    "actesAdministratifs",
    "documentsFinanciers",
  ];

  const objectNestedFields = ["logo"];

  if (
    typeof initialObject !== "object" ||
    initialObject === null ||
    Array.isArray(initialObject)
  ) {
    return initialObject;
  }

  const prismaObject: Record<string, unknown> = { ...initialObject };

  for (const field of arrayNestedFields) {
    if (Array.isArray((initialObject as Record<string, unknown>)[field])) {
      prismaObject[field] = {
        create: (
          (initialObject as Record<string, unknown>)[field] as unknown[]
        ).map(convertToPrismaObject),
      };
    }
  }

  for (const field of objectNestedFields) {
    const fieldValue = (initialObject as Record<string, unknown>)[field];
    if (
      fieldValue !== undefined &&
      fieldValue !== null &&
      typeof fieldValue === "object" &&
      !Array.isArray(fieldValue)
    ) {
      prismaObject[field] = {
        create: convertToPrismaObject(fieldValue),
      };
    }
  }

  return prismaObject;
};
