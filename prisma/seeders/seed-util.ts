import { fakerFR as faker } from "@faker-js/faker";

export const generateDatePair = (): Date[] => {
  const date1 = faker.date.past({ years: 1 });
  const date2 = faker.date.between({
    from: date1,
    to: faker.date.future({ years: 1 }),
  });
  return [date1, date2];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToPrismaObject = (initialObject: unknown): any => {
  const objectNestedFields = [
    "structures",
    "contacts",
    "adresses",
    "adresseTypologies",
    "budgets",
    "fileUploads",
    "controles",
    "structureTypologies",
    "forms",
    "formSteps",
    "activites",
    "evenementsIndesirablesGraves",
  ];

  if (
    typeof initialObject !== "object" ||
    initialObject === null ||
    Array.isArray(initialObject)
  )
    return initialObject;

  const prismaObject: Record<string, unknown> = { ...initialObject };

  for (const field of objectNestedFields) {
    if (Array.isArray((initialObject as Record<string, unknown>)[field])) {
      prismaObject[field] = {
        create: (
          (initialObject as Record<string, unknown>)[field] as unknown[]
        ).map(convertToPrismaObject),
      };
    }
  }

  return prismaObject;
};
